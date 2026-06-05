// seed.js — Pre-seed the database with mock users and 20 historical incidents
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import db from './db.js';
import config from '../config.js';

const SEED_USERS = [
  { email: 'admin@greengaurd.org', password: 'admin123', role: 'admin', full_name: 'Jane Vance', title: 'Platform Administrator' },
  { email: 'auditor@greengaurd.org', password: 'auditor123', role: 'auditor', full_name: 'Dr. Marcus Finch', title: 'Sustainability Auditor' },
  { email: 'consumer@greengaurd.org', password: 'consumer123', role: 'consumer', full_name: 'David K.', title: 'General Consumer' }
];

const SEED_INCIDENTS = [
  { product_name: 'Eco-Wear Tee', company_name: 'H&M Conscious', parent_corporation: 'H&M Group', category: 'Apparel', skeptic_score: 82, severity: 'Critical', status: 'Verified', text_content: 'Consciously crafted garments made with 100% sustainable materials for an eco-friendly lifecycle.', flag_type: 'Vague Sustainability Claim' },
  { product_name: 'Carbon-Neutral Offset Flight', company_name: 'Delta Air Lines', parent_corporation: 'Delta Air Lines Inc.', category: 'Aviation', skeptic_score: 94, severity: 'Critical', status: 'Verified', text_content: 'Fly carbon-neutral by offseting emissions with our verified forest plantation projects.', flag_type: 'Offset Manipulation' },
  { product_name: 'Clean Diesel SUV', company_name: 'Volkswagen AG', parent_corporation: 'Volkswagen Group', category: 'Automotive', skeptic_score: 98, severity: 'Critical', status: 'Verified', text_content: 'Low emissions clean diesel engine delivering maximum performance with minimal footprint.', flag_type: 'Blatant False Claim' },
  { product_name: 'Pure Botanical Shampoo', company_name: 'GreenGlow Skincare', parent_corporation: 'Independent', category: 'Personal Care', skeptic_score: 54, severity: 'Medium', status: 'Pending', text_content: 'Nourish your hair with 100% organic botanicals sourced directly from sustainable reserves.', flag_type: 'Unverified Certification' },
  { product_name: 'Biodegradable Water Bottle', company_name: 'AquaPure Global', parent_corporation: 'Nestle Group', category: 'Beverages', skeptic_score: 89, severity: 'Critical', status: 'Verified', text_content: 'Planet-friendly biodegradable packaging that degrades naturally, preserving ocean lifecycles.', flag_type: 'False Biodegradable Claims' },
  { product_name: 'Green Investment Fund', company_name: 'BlackRock Sustainable', parent_corporation: 'BlackRock Inc.', category: 'Finance', skeptic_score: 45, severity: 'Medium', status: 'Verified', text_content: 'Invest in net-zero transition initiatives and foster eco-conscious corporate behavior.', flag_type: 'Vague Marketing Wording' },
  { product_name: 'Zero-Emission Gas Station', company_name: 'BP Carbon Offsets', parent_corporation: 'BP plc', category: 'Energy', skeptic_score: 92, severity: 'Critical', status: 'Verified', text_content: 'Offsetting our retail fuel stations via wind farm investments to achieve zero-carbon retail locations.', flag_type: 'Offset Manipulation' },
  { product_name: 'Organic Bamboo Socks', company_name: 'EthicalThreads', parent_corporation: 'FairTrade Corp', category: 'Apparel', skeptic_score: 12, severity: 'Low', status: 'Rejected', text_content: 'Ethically spun organic bamboo fibers providing standard breathable comfort.', flag_type: 'Vague Marketing Wording' },
  { product_name: 'Eco-Clean Laundry Detergent', company_name: 'GreenClean Co.', parent_corporation: 'Unilever', category: 'Household', skeptic_score: 68, severity: 'Medium', status: 'Pending', text_content: 'Concentrated eco-friendly cleaning formula utilizing natural elements to protect waterways.', flag_type: 'Unverified Certification' },
  { product_name: 'Sustainable Forestry Timber', company_name: 'TerraLog Corp', parent_corporation: 'TerraHolding', category: 'Construction', skeptic_score: 61, severity: 'Medium', status: 'Verified', text_content: 'Responsibly logged wood preserving forest biodiversity and replenishing ecosystems.', flag_type: 'Vague Sustainability Claim' },
  { product_name: 'Ocean-Plastic Sunglasses', company_name: 'ReWave Eyewear', parent_corporation: 'Independent', category: 'Apparel', skeptic_score: 38, severity: 'Low', status: 'Pending', text_content: 'Frames manufactured entirely from recycled ocean plastics swept from tropical shores.', flag_type: 'Unverified Certification' },
  { product_name: 'Carbon-Free Coal Power', company_name: 'CleanCoal Solutions', parent_corporation: 'EnergyUnion', category: 'Energy', skeptic_score: 96, severity: 'Critical', status: 'Verified', text_content: 'Utilizing carbon capture tech to deliver clean coal power with zero carbon release.', flag_type: 'Blatant False Claim' },
  { product_name: 'Natural Paper Cups', company_name: 'PaperPack Ltd', parent_corporation: 'MegaCorp', category: 'Household', skeptic_score: 58, severity: 'Medium', status: 'Verified', text_content: '100% compostable paper cups ideal for hot beverages. Made with renewable plant starch linings.', flag_type: 'Unverified Certification' },
  { product_name: 'Hybrid Electric Utility Vehicle', company_name: 'GigaTrucks', parent_corporation: 'AutoGiant Group', category: 'Automotive', skeptic_score: 42, severity: 'Medium', status: 'Pending', text_content: 'Fuel-efficient hybrid utility vehicle reducing inner-city emissions profiles.', flag_type: 'Vague Marketing Wording' },
  { product_name: 'Eco-Certified Palm Oil', company_name: 'VerdeSpreads', parent_corporation: 'AgriFoods Inc.', category: 'Food', skeptic_score: 75, severity: 'Medium', status: 'Verified', text_content: 'Certified palm oil preserving rainforest spaces and protecting orangutan habitats.', flag_type: 'Unverified Certification' },
  { product_name: 'Carbon-Neutral Beef', company_name: 'PrimalCuts Eco', parent_corporation: 'MeatHoldings', category: 'Food', skeptic_score: 84, severity: 'Critical', status: 'Verified', text_content: 'Methane-reduced beef offsetting pasture carbon output through pasture rotation schemes.', flag_type: 'Offset Manipulation' },
  { product_name: 'Bio-Gas Home Heating', company_name: 'EcoFlame Heat', parent_corporation: 'NationalGas', category: 'Energy', skeptic_score: 50, severity: 'Medium', status: 'Pending', text_content: 'Sustainable bio-gas offsets applied directly to residential heating pipelines.', flag_type: 'Vague Marketing Wording' },
  { product_name: 'Green-Cured Leather Shoes', company_name: 'SoleConscious', parent_corporation: 'Independent', category: 'Apparel', skeptic_score: 25, severity: 'Low', status: 'Rejected', text_content: 'Vegetable-tanned leather shoes handcrafted with zero chromium sulfates.', flag_type: 'Vague Marketing Wording' },
  { product_name: 'Eco-Shield Glass Cleaner', company_name: 'ClearVision', parent_corporation: 'ChemicalCorp', category: 'Household', skeptic_score: 65, severity: 'Medium', status: 'Pending', text_content: 'Biodegradable glass cleaner leaving a streak-free shine using ammonia-free formulas.', flag_type: 'Unverified Certification' },
  { product_name: 'Recyclable Shipping Box', company_name: 'FlexiBox Logistics', parent_corporation: 'Independent', category: 'Logistics', skeptic_score: 18, severity: 'Low', status: 'Rejected', text_content: '100% recyclable cardboard boxes crafted from recycled post-consumer waste.', flag_type: 'Vague Marketing Wording' }
];

async function seed() {
  console.log('[SEED] Starting database seeding...');
  console.log(`[SEED] Mode: ${config.usePostgres ? 'PostgreSQL' : 'In-Memory'}`);

  // Create tables if using Postgres
  if (config.usePostgres) {
    await db.createTables();
  }

  // Seed users
  for (const u of SEED_USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const user = await db.createUser({ email: u.email, password_hash: hash, role: u.role, full_name: u.full_name, title: u.title });
    if (user) console.log(`[SEED] User: ${u.email} (${u.role})`);
  }

  // Seed incidents
  for (const inc of SEED_INCIDENTS) {
    await db.createIncident(inc);
  }
  console.log(`[SEED] Seeded ${SEED_INCIDENTS.length} incidents.`);
  console.log('[SEED] Done!');
}

// Export for programmatic use AND allow direct execution
export { seed, SEED_USERS, SEED_INCIDENTS };

// Run if executed directly
const isMain = process.argv[1] && (
  process.argv[1].endsWith('seed.js') || process.argv[1].includes('seed')
);
if (isMain) {
  seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
