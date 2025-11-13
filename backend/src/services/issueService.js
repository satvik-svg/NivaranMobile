const { supabase, supabaseAdmin } = require('../config/supabase');

class IssueService {
  static async createIssue(issueData) {
    try {
      console.log('🔵 [BACKEND] Creating issue:', issueData);
      
      // Force use of admin client to bypass RLS
      const client = supabaseAdmin || supabase;
      if (!client) {
        throw new Error('Supabase client not initialized');
      }
      
      console.log('🔵 [BACKEND] Using client:', supabaseAdmin ? 'ADMIN (bypasses RLS)' : 'ANON (subject to RLS)');
      
      // Map frontend categories to database categories
      const categoryMapping = {
        'infrastructure': 'road_maintenance',
        'safety': 'public_safety', 
        'environment': 'waste_management',
        'transport': 'road_maintenance',
        'other': 'other'
      };
      
      const dbCategory = categoryMapping[issueData.category] || issueData.category;
      
      // Prepare the issue data according to database schema
      const issuePayload = {
        title: issueData.title,
        description: issueData.description,
        category: dbCategory, // Use mapped category
        location: issueData.location, // JSONB field
        images: issueData.images || [], // Array field
        audio_url: issueData.audio_url,
        user_id: issueData.user_id,
        status: 'reported', // Default status from schema
        votes: 0, // Using 'votes' as per schema, not 'upvotes'
      };

      console.log('🔵 [BACKEND] Issue payload:', issuePayload);
      
      const { data, error } = await client
        .from('issues')
        .insert(issuePayload)
        .select()
        .single();

      if (error) {
        console.error('🔵 [BACKEND] Database error:', error);
        throw error;
      }

      console.log('🔵 [BACKEND] Issue created:', data);

      // Award points to user for reporting
      const pointsAwarded = await this.awardPointsToUser(issueData.user_id, 10, 'Issue reported');
      console.log('🔵 [BACKEND] Points awarded:', pointsAwarded);

      return { issue: data, error: null, pointsAwarded };
    } catch (error) {
      console.error('🔵 [BACKEND] Create issue error:', error);
      return { issue: null, error };
    }
  }

  static async getIssues(location, radius = 5000) {
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
      }
      
      let query = supabaseAdmin
        .from('issues')
        .select(`
          *,
          users:user_id (
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Filter by location in JavaScript since JSONB location filtering is complex
      let filteredIssues = data || [];
      
      if (location) {
        filteredIssues = filteredIssues.filter(issue => {
          if (!issue.location?.latitude || !issue.location?.longitude) return true;
          
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            issue.location.latitude,
            issue.location.longitude
          );
          
          return distance <= radius;
        });
      }

      return { issues: filteredIssues, error: null };
    } catch (error) {
      console.error('🔵 [BACKEND] Get issues error:', error);
      return { issues: [], error };
    }
  }

  static async upvoteIssue(issueId, userId) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('issue_id', issueId)
        .eq('user_id', userId)
        .single();

      if (existingVote) {
        return { error: 'Already voted' };
      }

      // Add vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          issue_id: issueId,
          user_id: userId,
        });

      if (voteError) throw voteError;

      // Increment votes count (using 'votes' field as per schema)
      const { data: issue } = await supabase
        .from('issues')
        .select('votes')
        .eq('id', issueId)
        .single();

      const { error: updateError } = await supabase
        .from('issues')
        .update({ votes: (issue?.votes || 0) + 1 })
        .eq('id', issueId);

      if (updateError) throw updateError;

      // Award points to user for voting
      await this.awardPointsToUser(userId, 5, 'Issue upvoted');

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Helper method to calculate distance between two points
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  static async updateIssueStatus(issueId, status) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('issues')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', issueId)
        .select()
        .single();

      if (error) throw error;
      return { issue: data, error: null };
    } catch (error) {
      return { issue: null, error };
    }
  }

  static async awardPointsToUser(userId, points, reason) {
    try {
      console.log('🎯 [POINTS] Awarding points:', { userId, points, reason });
      
      // Use admin client to bypass RLS for points operations
      const client = supabaseAdmin || supabase;
      if (!client) {
        throw new Error('Supabase client not initialized');
      }
      
      console.log('🎯 [POINTS] Using client:', supabaseAdmin ? 'ADMIN (bypasses RLS)' : 'ANON (subject to RLS)');
      
      // Add to rewards table
      const { error: rewardError } = await client.from('rewards').insert({
        user_id: userId,
        points_earned: points, // Using correct field name from schema
        reason,
      });

      if (rewardError) {
        console.error('🎯 [POINTS] Reward insert error:', rewardError);
        throw rewardError;
      }

      // Update user points
      const { data: user } = await client
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      const newPoints = (user?.points || 0) + points;
      
      const { error: updateError } = await client
        .from('users')
        .update({ points: newPoints })
        .eq('id', userId);

      if (updateError) {
        console.error('🎯 [POINTS] User update error:', updateError);
        throw updateError;
      }

      console.log('🎯 [POINTS] Points awarded successfully. New total:', newPoints);
      return points;
    } catch (error) {
      console.error('🎯 [POINTS] Error awarding points:', error);
      return 0;
    }
  }
}

module.exports = IssueService;
