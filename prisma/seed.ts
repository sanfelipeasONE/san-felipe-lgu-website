import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

// 2 corresponds to Argon2id in @node-rs/argon2
const ARGON2ID_ALGORITHM = 2;

const prisma = new PrismaClient();

const BASELINE_PERMISSIONS = [
  // User Management
  { code: "users.view", name: "View Users", module: "users", description: "View staff user accounts" },
  { code: "users.create", name: "Create Users", module: "users", description: "Create staff user accounts" },
  { code: "users.update", name: "Update Users", module: "users", description: "Update staff user account details" },
  { code: "users.disable", name: "Disable Users", module: "users", description: "Suspend or deactivate user accounts" },

  // Office Management
  { code: "offices.view", name: "View Offices", module: "offices", description: "View municipal office records" },
  { code: "offices.update", name: "Update Offices", module: "offices", description: "Update municipal office profiles and information" },

  // Posts & Announcements
  { code: "posts.view", name: "View Posts", module: "posts", description: "View municipal posts and announcements" },
  { code: "posts.create", name: "Create Posts", module: "posts", description: "Draft posts and news items" },
  { code: "posts.update", name: "Update Posts", module: "posts", description: "Edit existing post drafts" },
  { code: "posts.delete", name: "Delete Posts", module: "posts", description: "Remove posts" },
  { code: "posts.submit", name: "Submit Posts", module: "posts", description: "Submit post drafts for review" },
  { code: "posts.approve", name: "Approve Posts", module: "posts", description: "Review and approve submitted posts" },
  { code: "posts.publish", name: "Publish Posts", module: "posts", description: "Publish approved posts to the public website" },
  { code: "posts.archive", name: "Archive Posts", module: "posts", description: "Archive municipal posts and news items" },

  // Documents & Transparency
  { code: "documents.view", name: "View Documents", module: "documents", description: "View uploaded documents and full disclosure records" },
  { code: "documents.create", name: "Create Documents", module: "documents", description: "Upload new municipal documents" },
  { code: "documents.update", name: "Update Documents", module: "documents", description: "Edit document metadata and records" },
  { code: "documents.delete", name: "Delete Documents", module: "documents", description: "Remove documents" },
  { code: "documents.approve", name: "Approve Documents", module: "documents", description: "Approve documents for publication" },
  { code: "documents.publish", name: "Publish Documents", module: "documents", description: "Publish documents to the transparency portal" },

  // Municipal Events
  { code: "events.create", name: "Create Events", module: "events", description: "Create calendar events" },
  { code: "events.update", name: "Update Events", module: "events", description: "Modify calendar events" },
  { code: "events.publish", name: "Publish Events", module: "events", description: "Publish events to the public calendar" },

  // Audit Logs
  { code: "audit.view", name: "View Audit Logs", module: "audit", description: "Inspect administrative audit logs" },

  // Portal Settings
  { code: "settings.manage", name: "Manage Settings", module: "settings", description: "Manage portal configuration and settings" },

  // Municipal Services Management (Phase 13)
  { code: "services.view", name: "View Services", module: "services", description: "View municipal service pages and drafts" },
  { code: "services.update", name: "Update Services", module: "services", description: "Edit municipal service page content and sections" },
  { code: "services.publish", name: "Publish Services", module: "services", description: "Publish municipal service content to the public portal" },
];

const BASELINE_ROLES = [
  {
    name: "Super Administrator",
    slug: "super-admin",
    description: "Unrestricted municipal system authority across all offices and modules",
    isSystemScope: true,
  },
  {
    name: "Site Administrator",
    slug: "site-admin",
    description: "System-wide administrative authority for municipal public content and staff oversight",
    isSystemScope: true,
  },
  {
    name: "Office Administrator",
    slug: "office-admin",
    description: "Administrative authority scoped to an assigned municipal office",
    isSystemScope: false,
  },
  {
    name: "Approver",
    slug: "approver",
    description: "Reviews and publishes content and documents for an assigned municipal office",
    isSystemScope: false,
  },
  {
    name: "Office Editor",
    slug: "office-editor",
    description: "Creates and edits drafts for an assigned municipal office",
    isSystemScope: false,
  },
  {
    name: "Staff",
    slug: "staff",
    description: "Office content personnel authorized to create, edit, and publish content for their assigned office",
    isSystemScope: false,
  },
];

async function main() {
  console.log("🌱 Starting San Felipe LGU Digital Portal seed...");

  // 1. Seed baseline permissions
  console.log("⚙️  Upserting baseline permissions...");
  const permissionMap = new Map<string, string>();
  for (const perm of BASELINE_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
      create: perm,
    });
    permissionMap.set(perm.code, record.id);
  }
  console.log(`   ✓ ${permissionMap.size} permissions registered.`);

  // 2. Seed baseline roles
  console.log("⚙️  Upserting baseline roles...");
  const roleMap = new Map<string, string>();
  for (const r of BASELINE_ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { slug: r.slug },
      update: {
        name: r.name,
        description: r.description,
        isSystemScope: r.isSystemScope,
      },
      create: r,
    });
    roleMap.set(r.slug, roleRecord.id);
  }
  console.log(`   ✓ ${roleMap.size} roles registered.`);

  // 3. Associate permissions to roles
  console.log("⚙️  Assigning permissions to roles...");
  const superAdminRoleId = roleMap.get("super-admin")!;
  const allPermissionIds = Array.from(permissionMap.values());

  // Super Admin gets ALL permissions
  for (const permissionId of allPermissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRoleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: superAdminRoleId,
        permissionId,
      },
    });
  }

  // Office Editor permissions
  const editorRoleId = roleMap.get("office-editor")!;
  const editorPermCodes = [
    "posts.view", "posts.create", "posts.update", "posts.submit", "posts.publish",
    "documents.view", "documents.create", "documents.update",
    "events.create", "events.update",
    "services.view", "services.update", "services.publish",
  ];
  for (const code of editorPermCodes) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: editorRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: editorRoleId, permissionId: permId },
      });
    }
  }

  // Staff permissions (canonical content user)
  const staffRoleId = roleMap.get("staff")!;
  const staffPermCodes = [
    "posts.view", "posts.create", "posts.update", "posts.publish",
    "documents.view", "documents.create", "documents.update",
    "events.create", "events.update",
    "services.view", "services.update", "services.publish",
  ];
  for (const code of staffPermCodes) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: staffRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: staffRoleId, permissionId: permId },
      });
    }
  }

  // Approver permissions
  const approverRoleId = roleMap.get("approver")!;
  const approverPermCodes = [
    "posts.view", "posts.approve", "posts.publish",
    "documents.view", "documents.approve", "documents.publish",
    "events.publish",
    "services.view", "services.publish",
  ];
  for (const code of approverPermCodes) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: approverRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: approverRoleId, permissionId: permId },
      });
    }
  }

  // Office Admin permissions
  const officeAdminRoleId = roleMap.get("office-admin")!;
  const officeAdminPermCodes = [
    "users.view", "offices.view", "offices.update",
    "posts.view", "posts.create", "posts.update", "posts.delete", "posts.submit", "posts.approve", "posts.archive",
    "documents.view", "documents.create", "documents.update", "documents.delete", "documents.approve",
    "events.create", "events.update", "events.publish",
    "services.view", "services.update", "services.publish",
  ];
  for (const code of officeAdminPermCodes) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: officeAdminRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: officeAdminRoleId, permissionId: permId },
      });
    }
  }

  // Site Admin permissions
  const siteAdminRoleId = roleMap.get("site-admin")!;
  const siteAdminPermCodes = [
    "users.view", "users.create", "users.update", "users.disable",
    "offices.view", "offices.update",
    "posts.view", "posts.create", "posts.update", "posts.delete", "posts.submit", "posts.approve", "posts.publish", "posts.archive",
    "documents.view", "documents.create", "documents.update", "documents.delete", "documents.approve", "documents.publish",
    "events.create", "events.update", "events.publish",
    "audit.view", "settings.manage",
    "services.view", "services.update", "services.publish",
  ];
  for (const code of siteAdminPermCodes) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: siteAdminRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: siteAdminRoleId, permissionId: permId },
      });
    }
  }
  console.log("   ✓ Role-permission assignments configured.");

  // 4. Seed ICT Office
  console.log("⚙️  Upserting ICT Office...");
  const ictOffice = await prisma.office.upsert({
    where: { slug: "icto" },
    update: {
      name: "Information and Communications Technology Office",
      shortName: "ICTO",
      description: "Manages municipal network infrastructure, digital portal operations, and systems security.",
      mandate: "To deliver reliable, secure, and transparent digital government services to the citizens and departments of San Felipe.",
      location: "2nd Floor, Municipal Hall, San Felipe, Zambales",
      officeHours: "Monday - Friday: 8:00 AM - 5:00 PM",
      status: "ACTIVE",
    },
    create: {
      name: "Information and Communications Technology Office",
      shortName: "ICTO",
      slug: "icto",
      description: "Manages municipal network infrastructure, digital portal operations, and systems security.",
      mandate: "To deliver reliable, secure, and transparent digital government services to the citizens and departments of San Felipe.",
      location: "2nd Floor, Municipal Hall, San Felipe, Zambales",
      officeHours: "Monday - Friday: 8:00 AM - 5:00 PM",
      status: "ACTIVE",
    },
  });
  console.log(`   ✓ ICT Office ready (ID: ${ictOffice.id}).`);

  // 5. Seed Super Admin User (Environment-driven only)
  const adminEmail = process.env.SEED_SUPERADMIN_EMAIL?.trim();
  const adminPassword = process.env.SEED_SUPERADMIN_PASSWORD?.trim();
  const adminName = process.env.SEED_SUPERADMIN_NAME?.trim() || "LGU System Administrator";

  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) {
      console.warn("⚠️  SEED_SUPERADMIN_PASSWORD is shorter than 12 characters. Skipping user creation for security.");
    } else {
      console.log(`⚙️  Upserting Super Admin user (${adminEmail})...`);
      const passwordHash = await hash(adminPassword, {
        algorithm: ARGON2ID_ALGORITHM,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });

      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          name: adminName,
          passwordHash,
          roleId: superAdminRoleId,
          officeId: ictOffice.id,
          status: "ACTIVE",
        },
        create: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          roleId: superAdminRoleId,
          officeId: ictOffice.id,
          status: "ACTIVE",
        },
      });

      console.log(`   ✓ Super Admin user configured (ID: ${adminUser.id}, Email: ${adminUser.email}).`);
    }
  } else {
    console.log("ℹ️  SEED_SUPERADMIN_EMAIL or SEED_SUPERADMIN_PASSWORD not set. Skipping initial admin user creation.");
  }

  // 6. Seed canonical Service Pages (Phase 13)
  console.log("⚙️  Upserting canonical Service Pages (DRAFT baseline)...");
  const CANONICAL_SERVICES = [
    {
      serviceKey: "citizens-charter",
      title: "Citizen's Charter",
      description: null,
    },
    {
      serviceKey: "business-permits",
      title: "Business Permits",
      description: null,
    },
    {
      serviceKey: "downloadable-forms",
      title: "Downloadable Forms",
      description: null,
    },
    {
      serviceKey: "job-opportunities",
      title: "Job Opportunities",
      description: null,
    },
  ];

  const seedAuthor = await prisma.user.findFirst({
    where: { role: { isSystemScope: true } },
    select: { id: true },
  });

  if (seedAuthor) {
    for (const svc of CANONICAL_SERVICES) {
      await prisma.servicePage.upsert({
        where: { serviceKey: svc.serviceKey },
        update: {
          title: svc.title,
          description: svc.description,
        },
        create: {
          serviceKey: svc.serviceKey,
          title: svc.title,
          description: svc.description,
          status: "DRAFT",
          createdById: seedAuthor.id,
        },
      });
    }
    console.log("   ✓ Canonical service pages registered in DRAFT status.");
  } else {
    console.log("ℹ️  No system administrator user found. Skipping canonical service page seed.");
  }

  console.log("✅ Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
