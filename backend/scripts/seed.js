// ═══════════════════════════════════════════════════════════
// ZAAVO — Database Seed Script
// Populates MongoDB with realistic starter data
// Run: node scripts/seed.js
// ═══════════════════════════════════════════════════════════

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Import models
const User           = require('../models/User.model');
const Restaurant     = require('../models/Restaurant.model');
const { Food }       = require('../models/Restaurant.model');
const { Coupon, DeliveryPartner } = require('../models/Order.model');

const colors = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', blue:'\x1b[34m', cyan:'\x1b[36m' };
const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

// ─── Seed Data ────────────────────────────────────────────────

const USERS = [
  { name:'Super Admin',     email:'admin@zaavo.app',       phone:'9000000001', password:'Admin@2025',  role:'admin',             userType:'other',      isVerified:true,  walletBalance:0,   loyaltyPoints:0 },
  { name:'Rohan Sharma',    email:'rohan@iitd.ac.in',      phone:'9811234567', password:'Student@123', role:'customer',          userType:'student',    isVerified:true,  walletBalance:150, loyaltyPoints:1240, institution:'IIT Delhi',     city:'Delhi' },
  { name:'Priya Mehta',     email:'priya.mehta@gmail.com', phone:'9922345678', password:'Gym@2025',    role:'customer',          userType:'gym_goer',   isVerified:true,  walletBalance:80,  loyaltyPoints:890, city:'Mumbai' },
  { name:'Arjun Reddy',     email:'arjun@nitw.ac.in',      phone:'9933456789', password:'Hostel@123',  role:'customer',          userType:'hostelite',  isVerified:true,  walletBalance:200, loyaltyPoints:540, institution:'NIT Warangal',  city:'Warangal' },
  { name:'Sneha Patel',     email:'sneha.cf@gmail.com',    phone:'9944567890', password:'CrossFit@1',  role:'customer',          userType:'gym_goer',   isVerified:true,  walletBalance:50,  loyaltyPoints:320, city:'Ahmedabad' },
  { name:'Raj Patel',       email:'raj@proteinktchn.com',  phone:'9955678901', password:'Rest@2025',   role:'restaurant_owner',  userType:'other',      isVerified:true,  walletBalance:0,   loyaltyPoints:0, city:'Delhi' },
  { name:'Campus Owner',    email:'owner@campusbites.com', phone:'9966789012', password:'Rest@2025',   role:'restaurant_owner',  userType:'other',      isVerified:true,  walletBalance:0,   loyaltyPoints:0, city:'Delhi' },
  { name:'Rahul Kumar',     email:'rahul.delivery@zaavo.com',phone:'9977890123',password:'Rider@2025', role:'delivery_partner',  userType:'other',      isVerified:true,  walletBalance:0,   loyaltyPoints:0, city:'Delhi' },
  { name:'Amit Singh',      email:'amit.delivery@zaavo.com', phone:'9988901234',password:'Rider@2025', role:'delivery_partner',  userType:'other',      isVerified:true,  walletBalance:0,   loyaltyPoints:0, city:'Delhi' },
];

const RESTAURANTS_DATA = (ownerIds) => [
  {
    owner: ownerIds[0],
    name: 'The Protein Kitchen',
    description: 'Science-backed fitness meals for serious athletes and campus warriors. Every dish is macro-tracked and chef-approved.',
    cuisine: ['Fitness & Healthy', 'High Protein', 'Salads'],
    address: { line1: 'Shop 12, Campus Gate Road', city: 'Delhi', pincode: '110016' },
    location: { type: 'Point', coordinates: [77.1925, 28.5494] },
    phone: '9955678901',
    rating: 4.8, totalReviews: 1204, totalOrders: 4892,
    minOrderAmount: 199, deliveryFee: 30, freeDeliveryAbove: 299, estimatedTime: '18-25 min',
    tags: ['High Protein', 'Vegan Options', 'Gym Approved', 'Macro Tracked'],
    badges: ['Top Rated', 'Trending'],
    isOpen: true, isVerified: true, isActive: true, isFeatured: true,
    activeOffer: '20% off on first order · Code: PROTEIN20',
    timings: [
      { day: 'Monday', open: '07:00', close: '22:00', isOpen: true },
      { day: 'Tuesday', open: '07:00', close: '22:00', isOpen: true },
      { day: 'Wednesday', open: '07:00', close: '22:00', isOpen: true },
      { day: 'Thursday', open: '07:00', close: '22:00', isOpen: true },
      { day: 'Friday', open: '07:00', close: '23:00', isOpen: true },
      { day: 'Saturday', open: '08:00', close: '23:00', isOpen: true },
      { day: 'Sunday', open: '09:00', close: '21:00', isOpen: true },
    ],
  },
  {
    owner: ownerIds[1],
    name: 'Campus Bites',
    description: 'Budget-friendly Indian street food for hostel heroes. Fast, hot, and always affordable.',
    cuisine: ['Indian Street Food', 'North Indian', 'Snacks'],
    address: { line1: 'Hostel Zone, Block B Market', city: 'Delhi', pincode: '110067' },
    location: { type: 'Point', coordinates: [77.1800, 28.5510] },
    phone: '9966789012',
    rating: 4.6, totalReviews: 876, totalOrders: 8921,
    minOrderAmount: 49, deliveryFee: 0, freeDeliveryAbove: 99, estimatedTime: '12-20 min',
    tags: ['Budget Friendly', 'Student Special', 'Fast', 'Late Night'],
    badges: ['Budget Pick', 'Fan Favorite'],
    isOpen: true, isVerified: true, isActive: true, isFeatured: true,
    activeOffer: 'Free delivery above ₹99 · Always!',
    timings: [
      { day: 'Monday', open: '08:00', close: '02:00', isOpen: true },
      { day: 'Tuesday', open: '08:00', close: '02:00', isOpen: true },
      { day: 'Wednesday', open: '08:00', close: '02:00', isOpen: true },
      { day: 'Thursday', open: '08:00', close: '02:00', isOpen: true },
      { day: 'Friday', open: '08:00', close: '03:00', isOpen: true },
      { day: 'Saturday', open: '09:00', close: '03:00', isOpen: true },
      { day: 'Sunday', open: '09:00', close: '01:00', isOpen: true },
    ],
  },
  {
    owner: ownerIds[0],
    name: 'Muscle Meal Co.',
    description: 'Precision nutrition for elite performance. Bulking, cutting, keto — we engineer every macro for your goal.',
    cuisine: ['Fitness & Nutrition', 'Meal Prep', 'Keto'],
    address: { line1: '3rd Floor, FitLife Mall, Sector 18', city: 'Noida', pincode: '201301' },
    location: { type: 'Point', coordinates: [77.3909, 28.5675] },
    phone: '9955678902',
    rating: 4.9, totalReviews: 2103, totalOrders: 6732,
    minOrderAmount: 249, deliveryFee: 40, freeDeliveryAbove: 499, estimatedTime: '25-35 min',
    tags: ['Keto', 'Macro Tracked', 'Bulk Orders', 'Subscription'],
    badges: ['Top Rated', 'Premium'],
    isOpen: true, isVerified: true, isActive: true, isFeatured: true,
    activeOffer: 'Subscription plan saves 30% monthly',
  },
  {
    owner: ownerIds[0],
    name: 'Green Bowl',
    description: 'Fresh, organic, plant-powered bowls for the conscious eater. Guilt-free and absolutely delicious.',
    cuisine: ['Salads & Wraps', 'Vegan', 'Organic'],
    address: { line1: 'Green Park Extension, Main Market', city: 'Delhi', pincode: '110016' },
    location: { type: 'Point', coordinates: [77.2090, 28.5593] },
    phone: '9977890000',
    rating: 4.7, totalReviews: 789, totalOrders: 2341,
    minOrderAmount: 149, deliveryFee: 25, freeDeliveryAbove: 249, estimatedTime: '10-18 min',
    tags: ['Vegan', 'Organic', 'Light Meals', 'Gluten Free'],
    badges: ['Healthy Choice'],
    isOpen: true, isVerified: true, isActive: true, isFeatured: false,
    activeOffer: 'Buy 2 get 1 free salad bowl',
  },
  {
    owner: ownerIds[0],
    name: 'Shake Station',
    description: 'Post-workout protein shakes, smoothies, and energy boosters. Blended fresh, delivered fast.',
    cuisine: ['Beverages & Smoothies', 'Protein Shakes'],
    address: { line1: 'Gym District, Building 5', city: 'Delhi', pincode: '110020' },
    location: { type: 'Point', coordinates: [77.2100, 28.5500] },
    phone: '9988901235',
    rating: 4.8, totalReviews: 654, totalOrders: 3421,
    minOrderAmount: 99, deliveryFee: 20, freeDeliveryAbove: 199, estimatedTime: '8-15 min',
    tags: ['Post Workout', 'Fresh', 'Energy Boost', 'Recovery'],
    badges: ['Fan Favorite'],
    isOpen: true, isVerified: true, isActive: true, isFeatured: false,
    activeOffer: 'Free protein shot with every shake today!',
  },
];

const FOODS_DATA = (restaurantIds) => [
  // ── Protein Kitchen ──────────────────────────────────────────
  {
    restaurant: restaurantIds[0],
    name: 'High Protein Chicken Bowl',
    description: 'Grilled chicken breast, quinoa, roasted vegetables, and tahini dressing. Your post-workout best friend.',
    price: 249, originalPrice: 299, discount: 17,
    category: 'High Protein', dietType: 'non-veg', fitnessGoal: 'high_protein',
    tags: ['Keto Friendly', 'Post Workout', 'Gluten Free'],
    nutrition: { calories: 520, protein: 48, carbs: 35, fat: 12, fiber: 8, sugar: 4, sodium: 380 },
    servingSize: '380g', rating: 4.9, totalOrders: 1204, isPopular: true, isAvailable: true, prepTime: 12,
  },
  {
    restaurant: restaurantIds[0],
    name: 'Grilled Paneer Tikka',
    description: 'Protein-rich paneer in spiced marinade, grilled to perfection. Vegetarian muscle fuel.',
    price: 199, originalPrice: 229,
    category: 'High Protein', dietType: 'veg', fitnessGoal: 'high_protein',
    tags: ['Vegetarian', 'Gym Snack', 'High Calcium'],
    nutrition: { calories: 350, protein: 28, carbs: 12, fat: 22, fiber: 2, sugar: 3, sodium: 290 },
    servingSize: '250g', rating: 4.7, totalOrders: 876, isPopular: true, isAvailable: true, prepTime: 15,
  },
  {
    restaurant: restaurantIds[0],
    name: 'Salmon Power Plate',
    description: 'Pan-seared Atlantic salmon with steamed broccoli, sweet potato, and lemon butter.',
    price: 389, originalPrice: 429,
    category: 'High Protein', dietType: 'non-veg', fitnessGoal: 'cutting',
    tags: ['Omega-3', 'Clean Eating', 'Premium'],
    nutrition: { calories: 480, protein: 42, carbs: 28, fat: 18, fiber: 6, sugar: 8, sodium: 310 },
    servingSize: '350g', rating: 4.8, totalOrders: 543, isPopular: false, isAvailable: true, prepTime: 18,
  },

  // ── Campus Bites ─────────────────────────────────────────────
  {
    restaurant: restaurantIds[1],
    name: 'Masala Maggi Stack',
    description: 'The ultimate hostel comfort food. Double Maggi, extra masala, topped with egg. Midnight essential.',
    price: 69, originalPrice: 79,
    category: 'Budget Meal', dietType: 'non-veg', fitnessGoal: 'none',
    tags: ['Late Night', 'Quick Fix', 'Comfort Food', 'Best Seller'],
    nutrition: { calories: 380, protein: 12, carbs: 62, fat: 11, fiber: 2, sugar: 3, sodium: 820 },
    servingSize: '250g', rating: 4.5, totalOrders: 8921, isPopular: true, isAvailable: true, prepTime: 5,
  },
  {
    restaurant: restaurantIds[1],
    name: 'Veg Thali Combo',
    description: '2 rotis, dal makhani, sabzi, rice, pickle, and papad. Full meal, student price.',
    price: 89, originalPrice: 109,
    category: 'Budget Meal', dietType: 'veg', fitnessGoal: 'none',
    tags: ['Full Meal', 'Homestyle', 'Value'],
    nutrition: { calories: 650, protein: 18, carbs: 98, fat: 16, fiber: 10, sugar: 6, sodium: 540 },
    servingSize: '500g', rating: 4.3, totalOrders: 4321, isPopular: true, isAvailable: true, prepTime: 8,
  },
  {
    restaurant: restaurantIds[1],
    name: 'Egg Roll Special',
    description: 'Crispy paratha wrap with egg bhurji, onions, green chutney, and extra spice.',
    price: 59, originalPrice: 69,
    category: 'Street Food', dietType: 'non-veg', fitnessGoal: 'none',
    tags: ['Quick Bite', 'Spicy', 'Street Style'],
    nutrition: { calories: 420, protein: 16, carbs: 55, fat: 14, fiber: 3, sugar: 2, sodium: 610 },
    servingSize: '200g', rating: 4.4, totalOrders: 6102, isPopular: true, isAvailable: true, prepTime: 6,
  },

  // ── Muscle Meal Co. ──────────────────────────────────────────
  {
    restaurant: restaurantIds[2],
    name: 'Bulk Up Thali',
    description: 'Designed for mass gain. Chicken curry, paneer, dal, 3 rotis, rice, raita. 1200+ calories of clean fuel.',
    price: 349, originalPrice: 399,
    category: 'Bulking', dietType: 'non-veg', fitnessGoal: 'bulking',
    tags: ['Mass Gain', 'Calorie Dense', 'Post Workout'],
    nutrition: { calories: 1200, protein: 65, carbs: 140, fat: 28, fiber: 12, sugar: 10, sodium: 920 },
    servingSize: '800g', rating: 4.8, totalOrders: 2341, isPopular: true, isAvailable: true, prepTime: 20,
  },
  {
    restaurant: restaurantIds[2],
    name: 'Cutting Phase Salad',
    description: 'Low carb, high protein. Grilled chicken, mixed greens, cherry tomatoes, cucumber, and vinaigrette.',
    price: 279, originalPrice: 310,
    category: 'Cutting', dietType: 'non-veg', fitnessGoal: 'cutting',
    tags: ['Low Carb', 'Fat Loss', 'Clean'],
    nutrition: { calories: 285, protein: 35, carbs: 18, fat: 8, fiber: 6, sugar: 4, sodium: 280 },
    servingSize: '320g', rating: 4.6, totalOrders: 1102, isPopular: false, isAvailable: true, prepTime: 10,
  },
  {
    restaurant: restaurantIds[2],
    name: 'Keto King Platter',
    description: 'Zero carb perfection. Bacon, eggs, avocado, cheese, and leafy greens. Pure fat-burning mode.',
    price: 329, originalPrice: 369,
    category: 'Keto', dietType: 'non-veg', fitnessGoal: 'keto',
    tags: ['Zero Carb', 'Keto Certified', 'Premium'],
    nutrition: { calories: 480, protein: 42, carbs: 6, fat: 32, fiber: 4, sugar: 2, sodium: 450 },
    servingSize: '350g', rating: 4.7, totalOrders: 892, isPopular: false, isAvailable: true, prepTime: 15,
  },

  // ── Green Bowl ───────────────────────────────────────────────
  {
    restaurant: restaurantIds[3],
    name: 'Vegan Protein Wrap',
    description: 'Whole wheat wrap packed with hummus, falafel, roasted veggies, and tahini. Plant power at its best.',
    price: 189, originalPrice: 220,
    category: 'Vegan', dietType: 'vegan', fitnessGoal: 'vegan',
    tags: ['Plant Based', 'Clean Eating', 'High Fiber'],
    nutrition: { calories: 410, protein: 22, carbs: 48, fat: 9, fiber: 12, sugar: 6, sodium: 320 },
    servingSize: '300g', rating: 4.7, totalOrders: 987, isPopular: false, isAvailable: true, prepTime: 10,
  },
  {
    restaurant: restaurantIds[3],
    name: 'Buddha Bowl Supreme',
    description: 'Quinoa base with roasted chickpeas, sweet potato, avocado, beets, and tahini drizzle.',
    price: 229, originalPrice: 259,
    category: 'Vegan', dietType: 'vegan', fitnessGoal: 'vegan',
    tags: ['Superfood', 'Antioxidant Rich', 'Instagram Worthy'],
    nutrition: { calories: 480, protein: 18, carbs: 68, fat: 14, fiber: 14, sugar: 12, sodium: 290 },
    servingSize: '420g', rating: 4.8, totalOrders: 654, isPopular: true, isAvailable: true, prepTime: 12,
  },

  // ── Shake Station ────────────────────────────────────────────
  {
    restaurant: restaurantIds[4],
    name: 'Post-Workout Protein Shake',
    description: '40g whey protein, banana, almond milk, peanut butter, and ice. The recovery shake you deserve.',
    price: 159, originalPrice: 179,
    category: 'High Protein', dietType: 'veg', fitnessGoal: 'high_protein',
    tags: ['Recovery', 'Energy', '40g Protein', 'Post Workout'],
    nutrition: { calories: 320, protein: 40, carbs: 30, fat: 4, fiber: 2, sugar: 18, sodium: 120 },
    servingSize: '400ml', rating: 4.9, totalOrders: 3421, isPopular: true, isAvailable: true, prepTime: 5,
  },
  {
    restaurant: restaurantIds[4],
    name: 'Mass Gainer Smoothie',
    description: 'Calorie-dense blend: oats, banana, whole milk, honey, whey protein, and dark chocolate.',
    price: 199, originalPrice: 229,
    category: 'Bulking', dietType: 'veg', fitnessGoal: 'bulking',
    tags: ['High Calorie', 'Mass Gain', 'Pre Workout'],
    nutrition: { calories: 680, protein: 35, carbs: 88, fat: 16, fiber: 4, sugar: 42, sodium: 180 },
    servingSize: '500ml', rating: 4.7, totalOrders: 1823, isPopular: false, isAvailable: true, prepTime: 5,
  },
  {
    restaurant: restaurantIds[4],
    name: 'Green Detox Smoothie',
    description: 'Spinach, cucumber, green apple, ginger, lemon, and cold water. Cleanse your system.',
    price: 139, originalPrice: 159,
    category: 'Weight Loss', dietType: 'vegan', fitnessGoal: 'weight_loss',
    tags: ['Detox', 'Low Cal', 'Alkaline'],
    nutrition: { calories: 120, protein: 4, carbs: 22, fat: 1, fiber: 6, sugar: 14, sodium: 40 },
    servingSize: '350ml', rating: 4.6, totalOrders: 1234, isPopular: false, isAvailable: true, prepTime: 5,
  },
];

const COUPONS_DATA = [
  { code: 'CAMPUS20', description: 'Student Saver - 20% off for college students', type: 'percentage', value: 20, maxDiscount: 100, minOrderAmount: 199, maxUsage: 5000, maxUsagePerUser: 3, applicableTo: 'all', isActive: true, expiresAt: new Date('2025-12-31'), icon: '🎓' },
  { code: 'ZAAVO100', description: 'Welcome offer - Flat ₹100 off on first order', type: 'fixed', value: 100, minOrderAmount: 299, maxUsage: 2000, maxUsagePerUser: 1, applicableTo: 'first_order', isActive: true, expiresAt: new Date('2025-12-31'), icon: '🎉' },
  { code: 'GYMPOWER', description: 'Gym Warrior - Free delivery on fitness meals', type: 'free_delivery', value: 30, minOrderAmount: 249, maxUsage: 1000, maxUsagePerUser: 5, applicableTo: 'all', isActive: true, expiresAt: new Date('2025-06-30'), icon: '💪' },
  { code: 'NIGHT50', description: 'Midnight Munchies - 50% off after 10 PM', type: 'percentage', value: 50, maxDiscount: 150, minOrderAmount: 149, maxUsage: 999, maxUsagePerUser: 10, applicableTo: 'all', isActive: true, expiresAt: new Date('2025-12-31'), icon: '🌙' },
  { code: 'VEGAN15', description: 'Plant Power - 15% off on all vegan meals', type: 'percentage', value: 15, maxDiscount: 80, minOrderAmount: 149, maxUsage: 500, maxUsagePerUser: 5, applicableTo: 'category', category: 'Vegan', isActive: true, expiresAt: new Date('2025-09-30'), icon: '🌱' },
  { code: 'HOSTEL49', description: 'Hostel Special - Free delivery every day', type: 'free_delivery', value: 30, minOrderAmount: 49, maxUsage: -1, maxUsagePerUser: -1, applicableTo: 'all', isActive: true, expiresAt: new Date('2025-12-31'), icon: '🏠' },
];

// ─── Main Seed Function ───────────────────────────────────────
async function seed() {
  try {
    log('\n═══════════════════════════════════════', 'cyan');
    log('  🌱 ZAAVO Database Seeder', 'cyan');
    log('═══════════════════════════════════════\n', 'cyan');

    // Connect
    await mongoose.connect(process.env.MONGO_URI);
    log('✅ MongoDB connected', 'green');

    // Clear existing data
    log('\n🧹 Clearing existing data...', 'yellow');
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Food.deleteMany({}),
      Coupon.deleteMany({}),
      DeliveryPartner.deleteMany({}),
    ]);
    log('✅ Cleared all collections', 'green');

    // Seed Users
    log('\n👤 Seeding users...', 'yellow');
    const createdUsers = await User.insertMany(USERS.map(u => ({
      ...u,
      referralCode: `ZAV-${u.name.slice(0,3).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`,
    })));
    log(`✅ Created ${createdUsers.length} users`, 'green');

    // Restaurant owners
    const restaurantOwners = createdUsers.filter(u => u.role === 'restaurant_owner');
    const deliveryUsers    = createdUsers.filter(u => u.role === 'delivery_partner');

    // Seed Restaurants
    log('\n🍽  Seeding restaurants...', 'yellow');
    const ownerIds = [restaurantOwners[0]._id, restaurantOwners[1]._id, restaurantOwners[0]._id, restaurantOwners[0]._id, restaurantOwners[0]._id];
    const createdRestaurants = await Restaurant.insertMany(RESTAURANTS_DATA(ownerIds));
    log(`✅ Created ${createdRestaurants.length} restaurants`, 'green');

    // Seed Foods
    log('\n🍔 Seeding food items...', 'yellow');
    const restaurantIds = createdRestaurants.map(r => r._id);
    const createdFoods  = await Food.insertMany(FOODS_DATA(restaurantIds));
    log(`✅ Created ${createdFoods.length} food items`, 'green');

    // Seed Delivery Partners
    log('\n🛵 Seeding delivery partners...', 'yellow');
    const partnerDocs = deliveryUsers.map((u, i) => ({
      user:            u._id,
      vehicleType:     'motorcycle',
      vehicleNumber:   `DL-0${i+1}-XY${1000+i}`,
      isVerified:      true,
      isOnline:        i === 0, // first one online
      currentLocation: { type: 'Point', coordinates: [77.1925 + (i*0.01), 28.5494 + (i*0.01)] },
      rating:          4.7 + (i * 0.1),
      totalDeliveries: 100 + (i * 50),
      totalEarnings:   8000 + (i * 2000),
    }));
    await DeliveryPartner.insertMany(partnerDocs);
    log(`✅ Created ${partnerDocs.length} delivery partners`, 'green');

    // Seed Coupons
    log('\n🎟  Seeding coupons...', 'yellow');
    const createdCoupons = await Coupon.insertMany(COUPONS_DATA);
    log(`✅ Created ${createdCoupons.length} coupons`, 'green');

    // Summary
    log('\n═══════════════════════════════════════', 'cyan');
    log('  ✅ SEED COMPLETE!', 'green');
    log('═══════════════════════════════════════', 'cyan');
    log('\n📋 Test Credentials:', 'blue');
    log('  🔑 Admin:   admin@zaavo.app / Admin@2025', 'blue');
    log('  👤 Student: rohan@iitd.ac.in / Student@123', 'blue');
    log('  💪 Gym:     priya.mehta@gmail.com / Gym@2025', 'blue');
    log('  🍽  Owner:   raj@proteinktchn.com / Rest@2025', 'blue');
    log('  🛵 Rider:   rahul.delivery@zaavo.com / Rider@2025', 'blue');
    log('\n📊 Data Summary:', 'yellow');
    log(`  Users: ${createdUsers.length}`, 'yellow');
    log(`  Restaurants: ${createdRestaurants.length}`, 'yellow');
    log(`  Food Items: ${createdFoods.length}`, 'yellow');
    log(`  Coupons: ${createdCoupons.length}`, 'yellow');
    log('\n');

    process.exit(0);
  } catch (error) {
    log(`\n❌ Seed Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

seed();
