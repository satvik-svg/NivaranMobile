import { supabase } from './supabase';
import { Issue, Location } from '../types';

// Helper function to upload image via backend API
async function uploadImageToStorage(imageUri: string): Promise<string | null> {
  try {
    console.log('📤 [UPLOAD] Starting image upload via backend:', imageUri);

    // Create FormData for the backend API
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'issue-image.jpg',
      type: 'image/jpeg',
    } as any);

    // Upload via backend API (uses service role key, bypasses RLS)
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:1200/api';
    const uploadUrl = `${apiUrl}/upload/image`;
    
    console.log('📤 [UPLOAD] Calling backend upload API:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        // Don't set Content-Type for FormData - let the browser set it with boundary
      },
      body: formData,
    });

    console.log('📤 [UPLOAD] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [UPLOAD] Backend error:', errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [UPLOAD] Upload successful:', result.url);
    
    return result.url;

  } catch (error) {
    console.error('❌ [UPLOAD] Image upload failed:', error);
    return null;
  }
}

export class IssueService {
  static async createIssue(issueData: {
    title: string;
    description: string;
    category: string;
    location: { latitude: number; longitude: number; address?: string };
    images?: string[];
    audio_url?: string;
    user_id: string;
  }) {
    try {
      console.log('📝 [CREATE_ISSUE] Starting issue creation...');
      console.log('📝 [CREATE_ISSUE] Issue data:', issueData);

      // Step 1: Handle images - use placeholder for now (image upload disabled)
      let uploadedImageUrls: string[] = [];
      
      if (issueData.images && issueData.images.length > 0) {
        console.log('📝 [CREATE_ISSUE] Images detected, using placeholder URLs...');
        
        // For each image, use a placeholder URL
        for (let i = 0; i < issueData.images.length; i++) {
          uploadedImageUrls.push(`placeholder-image-${i + 1}.jpg`);
        }
        
        console.log('📝 [CREATE_ISSUE] Using placeholder image URLs:', uploadedImageUrls);
      }

      // Step 2: Prepare issue data for backend
      const issuePayload = {
        title: issueData.title,
        description: issueData.description,
        category: issueData.category,
        location: issueData.location,
        images: uploadedImageUrls,
        audio_url: issueData.audio_url,
        user_id: issueData.user_id,
      };

      // Step 3: Call backend API to create issue and award points
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:1200/api';
      console.log('📝 [CREATE_ISSUE] Calling backend API:', `${apiUrl}/issues`);

      const response = await fetch(`${apiUrl}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(issuePayload),
      });

      console.log('📝 [CREATE_ISSUE] Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📝 [CREATE_ISSUE] Backend error:', errorText);
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📝 [CREATE_ISSUE] Backend response:', result);

      // Add helper properties for backward compatibility
      const issueWithHelpers = {
        ...result.issue,
        latitude: result.issue.location?.latitude || 0,
        longitude: result.issue.location?.longitude || 0,
        address: result.issue.location?.address,
        photo_url: result.issue.images?.[0],
        upvotes: result.issue.votes || 0
      };

      return { 
        issue: issueWithHelpers, 
        error: null,
        pointsAwarded: result.pointsAwarded || 0
      };

    } catch (error) {
      console.error('❌ [CREATE_ISSUE] Error creating issue:', error);
      return { issue: null, error };
    }
  }

  static async getIssues(location?: Location, radius: number = 5000) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      let query = supabase
        .from('issues')
        .select('*');

      // If location is provided, we could add distance filtering here
      // For now, let's get all issues and filter in memory
      const { data, error } = await query;

      if (error) throw error;

      // Add helper properties for backward compatibility and filter by distance if location provided
      let issues = (data || []).map(issue => ({
        ...issue,
        latitude: issue.location?.latitude || 0,
        longitude: issue.location?.longitude || 0,
        address: issue.location?.address,
        photo_url: issue.images?.[0],
        upvotes: issue.votes || 0
      }));

      // Simple distance filtering if location is provided
      if (location) {
        issues = issues.filter(issue => {
          if (!issue.location?.latitude || !issue.location?.longitude) return true;
          
          const distance = getDistanceFromLatLonInM(
            location.latitude,
            location.longitude,
            issue.location.latitude,
            issue.location.longitude
          );
          
          return distance <= radius;
        });
      }

      return { issues, error: null };
    } catch (error) {
      console.error('Error fetching issues:', error);
      return { issues: [], error };
    }
  }

  static async upvoteIssue(issueId: string, userId: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .eq('issue_id', issueId)
        .single();

      if (existingVote) {
        return { error: 'Already voted' };
      }

      // Add vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          user_id: userId,
          issue_id: issueId,
          created_at: new Date().toISOString()
        });

      if (voteError) throw voteError;

      // Update issue vote count
      const { error: updateError } = await supabase
        .rpc('increment_issue_votes', { issue_id: issueId });

      if (updateError) {
        // Fallback: manually increment votes
        const { data: issue } = await supabase
          .from('issues')
          .select('votes')
          .eq('id', issueId)
          .single();

        if (issue) {
          await supabase
            .from('issues')
            .update({ votes: (issue.votes || 0) + 1 })
            .eq('id', issueId);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error upvoting issue:', error);
      return { error };
    }
  }

  static async updateIssueStatus(issueId: string, status: Issue['status']) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', issueId)
        .select()
        .single();

      if (error) throw error;

      // Add helper properties for backward compatibility
      const issueWithHelpers = {
        ...data,
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
        address: data.location?.address,
        photo_url: data.images?.[0],
        upvotes: data.votes || 0
      };

      return { issue: issueWithHelpers, error: null };
    } catch (error) {
      console.error('Error updating issue status:', error);
      return { issue: null, error };
    }
  }
}

// Helper function to calculate distance between two points
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Convert to meters
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
