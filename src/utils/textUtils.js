export function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Resolves a user's display name from various possible formats
 * @param {string} userIdentifier - Could be email, userId, or name
 * @param {Array} organizationUsers - Array of user objects from the organization
 * @returns {string} The resolved display name
 */
export const resolveUserName = (userIdentifier, organizationUsers = []) => {
  if (!userIdentifier || !organizationUsers || organizationUsers.length === 0) {
    return userIdentifier || '';
  }

  // If it's already a name (not an email), return it
  if (!userIdentifier.includes('@')) {
    return userIdentifier;
  }

  // Try to find the user by email
  const user = organizationUsers.find(u => 
    u.email === userIdentifier || 
    u.email === userIdentifier.toLowerCase()
  );

  if (user) {
    return user.name || user.displayName || userIdentifier;
  }

  // If no match found, return the original identifier
  return userIdentifier;
};

/**
 * Resolves multiple user names from an array of identifiers
 * @param {Array} userIdentifiers - Array of user identifiers
 * @param {Array} organizationUsers - Array of user objects from the organization
 * @returns {Array} Array of resolved display names
 */
export const resolveUserNames = (userIdentifiers = [], organizationUsers = []) => {
  if (!Array.isArray(userIdentifiers)) return [];
  
  return userIdentifiers.map(identifier => 
    resolveUserName(identifier, organizationUsers)
  );
};


