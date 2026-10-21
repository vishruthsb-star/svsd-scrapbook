export interface ScrapbookPermissions {
  isOwner: boolean;
  canEditProfile: boolean;
  canChangePresentation: boolean;
  canManageContributors: boolean;
  canInviteContributors: boolean;
  canRemoveItems: boolean;
  canAddMemories: boolean;
  canBoop: boolean;
  canSeeContributorIdentity: boolean;
}

/**
 * UI-level permissions for this local-only prototype. They intentionally do not
 * represent server authorization: the current user is the stable mock account.
 */
export function deriveScrapbookPermissions(currentUserId: string, scrapbookOwnerId: string): ScrapbookPermissions {
  const isOwner = currentUserId === scrapbookOwnerId;
  return {
    isOwner,
    canEditProfile: isOwner,
    canChangePresentation: isOwner,
    canManageContributors: isOwner,
    canInviteContributors: isOwner,
    canRemoveItems: isOwner,
    canAddMemories: !isOwner,
    canBoop: !isOwner,
    canSeeContributorIdentity: isOwner,
  };
}
