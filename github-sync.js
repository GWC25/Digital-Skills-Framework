/**
 * GitHub Sync Module for Digital Skills Framework
 * 
 * Saves edits in the HTML interface directly back to areas-data.json in your GitHub repo
 * 
 * SETUP:
 * 1. Create a GitHub Personal Access Token (Settings > Developer Settings > Personal Access Tokens > Tokens (classic))
 *    - Permissions needed: "repo" (full control of private repositories)
 * 2. Add to your index.html before the closing script tag:
 *    <script src="github-sync.js"></script>
 * 3. Initialize with your GitHub credentials:
 *    const sync = new GitHubSync({
 *      owner: 'gwc25',
 *      repo: 'Digital-Skills-Framework',
 *      branch: 'main',
 *      path: 'areas-data.json',
 *      token: 'ghp_YOUR_PERSONAL_ACCESS_TOKEN'
 *    });
 */

class GitHubSync {
  constructor(config) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.branch = config.branch || 'main';
    this.path = config.path || 'areas-data.json';
    this.token = config.token;
    this.baseURL = 'https://api.github.com/repos';
    this.fileURL = `${this.baseURL}/${this.owner}/${this.repo}/contents/${this.path}`;
  }

  /**
   * Fetch current file from GitHub
   */
  async fetchFromGitHub() {
    try {
      const response = await fetch(this.fileURL, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+raw'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to fetch from GitHub:', error);
      throw error;
    }
  }

  /**
   * Get file metadata (SHA needed for updates)
   */
  async getFileSHA() {
    try {
      const response = await fetch(this.fileURL, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      return data.sha;
    } catch (error) {
      console.error('Failed to get file SHA:', error);
      throw error;
    }
  }

  /**
   * Save data back to GitHub
   */
  async saveToGitHub(data, commitMessage) {
    try {
      const sha = await this.getFileSHA();
      const content = btoa(JSON.stringify(data, null, 2)); // Base64 encode

      const response = await fetch(this.fileURL, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage || 'Update areas data via Digital Skills Framework editor',
          content: content,
          sha: sha,
          branch: this.branch
        })
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✓ Saved to GitHub:', result.commit.html_url);
      return result;
    } catch (error) {
      console.error('Failed to save to GitHub:', error);
      throw error;
    }
  }

  /**
   * Integration helper: call after editing
   */
  async syncAreaData(updatedAreas, commitMsg) {
    const data = { areas: updatedAreas };
    await this.saveToGitHub(data, commitMsg);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GitHubSync;
}
