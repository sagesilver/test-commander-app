import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building, Settings, Info, User, CreditCard, Palette, Globe } from 'lucide-react';
import OrganizationForm from '../components/organizations/OrganizationForm';

const OrganizationSettings = () => {
  const { currentUser, currentUserData, currentOrganization, loading } = useAuth();
  const [openEdit, setOpenEdit] = useState(false);

  if (loading || !currentUser) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--tc-icon))]"></div>
        </div>
      </div>
    );
  }

  const allowedRoles = ['APP_ADMIN', 'ORG_ADMIN'];
  const hasAccess = Array.isArray(currentUserData?.roles) && currentUserData.roles.some((r) => allowedRoles.includes(r));
  if (!hasAccess) {
    return (
      <div className="p-6">
        <div className="bg-card border border-subtle rounded-lg p-4">
          <h2 className="text-foreground font-semibold">Access Denied</h2>
          <p className="text-menu">You don't have permission to view organization settings.</p>
        </div>
      </div>
    );
  }

  const org = currentOrganization;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-foreground">
            {org?.name ? `${org.name} Settings` : 'Organization Settings'}
          </h1>
          <p className="text-menu">
            {org?.name ? `Manage settings and details for ${org.name}.` : 'No organization selected.'}
          </p>
        </div>
        {org && (
          <button onClick={() => setOpenEdit(true)} className="btn-primary flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Edit Settings</span>
          </button>
        )}
      </div>

      {!org ? (
        <div className="bg-card rounded-lg border border-subtle p-6">
          <p className="text-menu">Your account is not associated with an organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-subtle p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-menu">Name</div>
                <div className="text-foreground font-medium">{org.name || '—'}</div>
              </div>
              <div>
                <div className="text-menu">Description</div>
                <div className="text-foreground">{org.description || '—'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-menu">Industry</div>
                  <div className="text-foreground">{org.metadata?.industry || '—'}</div>
                </div>
                <div>
                  <div className="text-menu">Region</div>
                  <div className="text-foreground">{org.metadata?.region || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-subtle p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-semibold text-foreground">Contact</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-menu">Email</div>
                  <div className="text-foreground">{org.contactInfo?.email || '—'}</div>
                </div>
                <div>
                  <div className="text-menu">Phone</div>
                  <div className="text-foreground">{org.contactInfo?.phone || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-menu">Website</div>
                  <div className="text-foreground break-all">{org.contactInfo?.website || '—'}</div>
                </div>
                <div>
                  <div className="text-menu">Address</div>
                  <div className="text-foreground">{org.contactInfo?.address || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-subtle p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-semibold text-foreground">Subscription</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-menu">Plan</div>
                  <div className="text-foreground font-medium">{org.subscription?.plan || 'free'}</div>
                </div>
                <div>
                  <div className="text-menu">User Limit</div>
                  <div className="text-foreground">{org.subscription?.limits?.users ?? '—'}</div>
                </div>
                <div>
                  <div className="text-menu">Project Limit</div>
                  <div className="text-foreground">{org.subscription?.limits?.projects ?? '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-subtle p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-semibold text-foreground">Branding</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-menu">Primary Color</div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded border border-subtle"
                      style={{ backgroundColor: org.settings?.branding?.primaryColor || '#3762c4' }}
                    />
                    <span className="text-foreground font-mono text-sm">{org.settings?.branding?.primaryColor || '#3762c4'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-menu">Logo URL</div>
                  <div className="text-foreground break-all">{org.settings?.branding?.logo || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {org && (
        <OrganizationForm
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          organization={org}
          onSuccess={() => setOpenEdit(false)}
        />
      )}
    </div>
  );
};

export default OrganizationSettings;


