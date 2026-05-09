import { db } from './index';
import { organizations, users } from '../schema/users';
import { projects } from '../schema/projects';
import { properties, buildings, units } from '../schema/properties';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Create organization
    const [org] = await db
      .insert(organizations)
      .values({
        orgName: 'Acme Construction Company',
        orgType: 'owner',
        orgAddress: '123 Main St, City, State 12345',
        orgPhone: '555-0100',
        orgEmail: 'info@acmeconstruction.com',
      })
      .returning();

    console.log('✓ Created organization:', org.orgName);

    // 2. Create users
    const password = await bcrypt.hash('password123', 10);

    const testUsers = await db
      .insert(users)
      .values([
        {
          orgId: org.id,
          userEmail: 'admin@acme.com',
          userPasswordHash: password,
          userFirst: 'John',
          userLast: 'Admin',
          userRole: 'admin',
          userDepartment: 'finance',
        },
        {
          orgId: org.id,
          userEmail: 'pm@acme.com',
          userPasswordHash: password,
          userFirst: 'Sarah',
          userLast: 'Manager',
          userRole: 'pm',
          userDepartment: 'new_construction',
        },
        {
          orgId: org.id,
          userEmail: 'pe@acme.com',
          userPasswordHash: password,
          userFirst: 'Alex',
          userLast: 'Engineer',
          userRole: 'pe',
          userDepartment: 'new_construction',
        },
        {
          orgId: org.id,
          userEmail: 'pc@acme.com',
          userPasswordHash: password,
          userFirst: 'Emma',
          userLast: 'Coordinator',
          userRole: 'pc',
          userDepartment: 'new_construction',
        },
        {
          orgId: org.id,
          userEmail: 'super@acme.com',
          userPasswordHash: password,
          userFirst: 'Tom',
          userLast: 'Super',
          userRole: 'super',
          userDepartment: 'new_construction',
        },
      ])
      .returning();

    console.log('✓ Created users:', testUsers.length);

    // 3. Create property
    const [property] = await db
      .insert(properties)
      .values({
        orgId: org.id,
        propName: 'Riverside Apartments',
        propAddress: '456 River Rd',
        propCity: 'Springfield',
        propState: 'IL',
        propZip: '62701',
        propType: 'apartment',
        totalUnits: 120,
        totalBuildings: 3,
      })
      .returning();

    console.log('✓ Created property:', property.propName);

    // 4. Create buildings
    const testBuildings = await db
      .insert(buildings)
      .values([
        {
          propertyId: property.id,
          buildingNumber: 'A',
          buildingName: 'Building A',
          totalUnits: 40,
          floors: 4,
        },
        {
          propertyId: property.id,
          buildingNumber: 'B',
          buildingName: 'Building B',
          totalUnits: 40,
          floors: 4,
        },
        {
          propertyId: property.id,
          buildingNumber: 'C',
          buildingName: 'Building C',
          totalUnits: 40,
          floors: 4,
        },
      ])
      .returning();

    console.log('✓ Created buildings:', testBuildings.length);

    // 5. Create sample units (just a few for testing)
    await db.insert(units).values([
      {
        buildingId: testBuildings[0].id,
        unitNumber: '101',
        unitType: '2bed2bath',
        floorNumber: 1,
      },
      {
        buildingId: testBuildings[0].id,
        unitNumber: '102',
        unitType: '1bed1bath',
        floorNumber: 1,
      },
    ]);

    console.log('✓ Created sample units');

    // 6. Create projects
    const testProjects = await db
      .insert(projects)
      .values([
        {
          orgId: org.id,
          projectName: 'Riverside Phase 1',
          projectNumber: 'RVR-2025-001',
          projectType: 'new_construction',
          projectStatus: 'active',
          projectDepartment: 'new_construction',
          propertyId: property.id,
          projectManagerId: testUsers[1].id, // PM
          startDate: '2025-01-01',
          estimatedCompletion: '2025-12-31',
          totalBudget: '5000000.00',
          createdBy: testUsers[1].id,
        },
        {
          orgId: org.id,
          projectName: 'Riverside Phase 2',
          projectNumber: 'RVR-2025-002',
          projectType: 'new_construction',
          projectStatus: 'proposal',
          projectDepartment: 'new_construction',
          propertyId: property.id,
          projectManagerId: testUsers[1].id, // PM
          startDate: '2026-01-01',
          estimatedCompletion: '2026-12-31',
          totalBudget: '6000000.00',
          createdBy: testUsers[1].id,
        },
      ])
      .returning();

    console.log('✓ Created projects:', testProjects.length);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Test Login Credentials:');
    console.log('  Email: admin@acme.com');
    console.log('  Email: pm@acme.com');
    console.log('  Email: pe@acme.com');
    console.log('  Email: pc@acme.com');
    console.log('  Email: super@acme.com');
    console.log('  Password (all): password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
