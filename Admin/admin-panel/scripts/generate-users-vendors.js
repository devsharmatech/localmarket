/**
 * Script to generate and insert dummy users and vendors into Supabase
 * Run with: node scripts/generate-users-vendors.js
 */

// Load environment variables from .env.local
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn('Could not load .env.local file. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

// Supabase helper functions (CommonJS version)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function getKey() {
  return SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
}

async function supabaseRestInsert(pathWithQuery, rows) {
  const key = getKey();
  if (!SUPABASE_URL || !key) {
    throw new Error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) environment variables.');
  }
  
  const url = `${SUPABASE_URL}${pathWithQuery}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase REST error (${res.status}): ${text || res.statusText}`);
  }

  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Location data (simplified version)
const INDIAN_LOCATIONS = {
  "Delhi": {
    cities: {
      "New Delhi": {
        towns: {
          "Central Delhi": {
            tehsils: {
              "Connaught Place": { subTehsils: ["CP", "Janpath", "Parliament Street"] },
              "Chandni Chowk": { subTehsils: ["Old Delhi", "Red Fort", "Jama Masjid"] }
            }
          },
          "South Delhi": {
            tehsils: {
              "Saket": { subTehsils: ["Malviya Nagar", "Hauz Khas", "Green Park"] },
              "Vasant Kunj": { subTehsils: ["Vasant Vihar", "Munirka", "RK Puram"] }
            }
          }
        }
      }
    }
  },
  "Maharashtra": {
    cities: {
      "Mumbai": {
        towns: {
          "Mumbai Suburban": {
            tehsils: {
              "Andheri": { subTehsils: ["Andheri East", "Andheri West", "Jogeshwari"] },
              "Bandra": { subTehsils: ["Bandra East", "Bandra West", "Khar"] }
            }
          },
          "Thane": {
            tehsils: {
              "Thane": { subTehsils: ["Thane West", "Thane East", "Kopri"] }
            }
          }
        }
      },
      "Pune": {
        towns: {
          "Pune": {
            tehsils: {
              "Pune City": { subTehsils: ["Shivajinagar", "Kothrud", "Hinjewadi"] }
            }
          }
        }
      }
    }
  },
  "Karnataka": {
    cities: {
      "Bangalore": {
        towns: {
          "Bangalore Urban": {
            tehsils: {
              "Bangalore North": { subTehsils: ["Hebbal", "Yelahanka", "Yeshwanthpur"] },
              "Bangalore South": { subTehsils: ["Koramangala", "HSR Layout", "BTM Layout"] }
            }
          }
        }
      }
    }
  },
  "Gujarat": {
    cities: {
      "Ahmedabad": {
        towns: {
          "Ahmedabad": {
            tehsils: {
              "Ahmedabad City": { subTehsils: ["Navrangpura", "Maninagar", "Vastrapur"] }
            }
          }
        }
      }
    }
  },
  "Tamil Nadu": {
    cities: {
      "Chennai": {
        towns: {
          "Chennai": {
            tehsils: {
              "Chennai North": { subTehsils: ["T Nagar", "Anna Nagar", "Kilpauk"] }
            }
          }
        }
      }
    }
  },
  "West Bengal": {
    cities: {
      "Kolkata": {
        towns: {
          "Kolkata": {
            tehsils: {
              "Kolkata North": { subTehsils: ["Salt Lake", "New Town", "Rajarhat"] }
            }
          }
        }
      }
    }
  },
  "Rajasthan": {
    cities: {
      "Jaipur": {
        towns: {
          "Jaipur": {
            tehsils: {
              "Jaipur City": { subTehsils: ["Malviya Nagar", "Vaishali Nagar", "C Scheme"] }
            }
          }
        }
      }
    }
  },
  "Uttar Pradesh": {
    cities: {
      "Lucknow": {
        towns: {
          "Lucknow": {
            tehsils: {
              "Lucknow City": { subTehsils: ["Gomti Nagar", "Hazratganj", "Aliganj"] }
            }
          }
        }
      }
    }
  },
  "Telangana": {
    cities: {
      "Hyderabad": {
        towns: {
          "Hyderabad": {
            tehsils: {
              "Hyderabad Central": { subTehsils: ["Banjara Hills", "Jubilee Hills", "Hitech City"] }
            }
          }
        }
      }
    }
  },
  "Punjab": {
    cities: {
      "Chandigarh": {
        towns: {
          "Chandigarh": {
            tehsils: {
              "Chandigarh": { subTehsils: ["Sector 17", "Sector 35", "Sector 22"] }
            }
          }
        }
      }
    }
  }
};

function getAllLocations() {
  const locations = [];
  Object.keys(INDIAN_LOCATIONS).forEach(state => {
    Object.keys(INDIAN_LOCATIONS[state].cities).forEach(city => {
      Object.keys(INDIAN_LOCATIONS[state].cities[city].towns).forEach(town => {
        Object.keys(INDIAN_LOCATIONS[state].cities[city].towns[town].tehsils).forEach(tehsil => {
          const subTehsils = INDIAN_LOCATIONS[state].cities[city].towns[town].tehsils[tehsil].subTehsils;
          subTehsils.forEach(subTehsil => {
            locations.push({
              state,
              city,
              town,
              tehsil,
              subTehsil,
            });
          });
        });
      });
    });
  });
  return locations;
}

// Indian names for realistic data
const firstNames = [
  'Raj', 'Priya', 'Amit', 'Sneha', 'Rahul', 'Anjali', 'Vikram', 'Kavita',
  'Suresh', 'Meera', 'Arjun', 'Divya', 'Karan', 'Pooja', 'Rohan', 'Neha',
  'Vivek', 'Shreya', 'Aditya', 'Riya', 'Kunal', 'Ananya', 'Nikhil', 'Isha',
  'Siddharth', 'Tanvi', 'Manish', 'Aishwarya', 'Gaurav', 'Sanjana', 'Harsh',
  'Ritika', 'Abhishek', 'Nisha', 'Yash', 'Kritika', 'Ravi', 'Swati', 'Deepak',
  'Monika', 'Ajay', 'Preeti', 'Sandeep', 'Jyoti', 'Pankaj', 'Madhuri'
];

const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Yadav', 'Shah',
  'Mehta', 'Jain', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Menon', 'Pillai',
  'Malhotra', 'Kapoor', 'Agarwal', 'Bansal', 'Goyal', 'Arora', 'Chopra',
  'Bhatia', 'Seth', 'Tiwari', 'Mishra', 'Pandey', 'Dubey', 'Trivedi'
];

const shopNames = [
  'Fresh Mart', 'Quick Store', 'City Groceries', 'Daily Needs', 'Super Market',
  'Local Store', 'Family Shop', 'Prime Grocers', 'Best Deals', 'Value Store',
  'Happy Shopping', 'Reliable Store', 'Trust Mart', 'Good Price', 'Smart Shop',
  'Mega Store', 'Discount Mart', 'Budget Shop', 'Economy Store', 'Premium Grocers',
  'Green Mart', 'Organic Store', 'Fresh Corner', 'Veggie Shop', 'Fruit Paradise',
  'Spice World', 'Grain Store', 'Dairy Delight', 'Bakery Corner', 'Sweet Shop'
];

const categories = [
  'Grocery', 'General Store', 'Groceries', 'Fruits & Vegetables', 'Dairy Products',
  'Bakery', 'Beverages', 'Snacks', 'Spices', 'Grains & Pulses', 'Organic Store',
  'Supermarket', 'Convenience Store', 'Department Store', 'Food Store'
];

const circles = ['North Circle', 'South Circle', 'East Circle', 'West Circle', 'Central Circle'];

const statuses = ['Active', 'Active', 'Active', 'Pending', 'Blocked']; // More Active than others
const kycStatuses = ['Approved', 'Approved', 'Approved', 'Pending', 'Rejected']; // More Approved

// Generate random phone number
function generatePhone() {
  const prefixes = ['9876', '9875', '9874', '9873', '9872', '9871', '9870', '9869', '9868', '9867'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${suffix}`;
}

// Generate random email
function generateEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domain}`;
}

// Generate random date within last year
function randomDate(start = new Date(2024, 0, 1), end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random date in last 30 days (for last_active_at)
function recentDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

// Generate users
function generateUsers(count = 50) {
  const users = [];
  const locations = getAllLocations();
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const phone = generatePhone();
    const email = generateEmail(firstName, lastName);
    const location = locations[Math.floor(Math.random() * locations.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = randomDate();
    const lastActiveAt = status === 'Active' ? recentDate() : null;
    
    users.push({
      full_name: fullName,
      email: email,
      phone: phone,
      state: location.state,
      city: location.city,
      status: status,
      created_at: createdAt.toISOString(),
      last_active_at: lastActiveAt ? lastActiveAt.toISOString() : null,
    });
  }
  
  return users;
}

// Generate vendors
function generateVendors(count = 30) {
  const vendors = [];
  const locations = getAllLocations();
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const ownerName = `${firstName} ${lastName}`;
    const shopName = shopNames[Math.floor(Math.random() * shopNames.length)];
    const contactNumber = generatePhone();
    const email = generateEmail(firstName, lastName);
    const location = locations[Math.floor(Math.random() * locations.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const kycStatus = kycStatuses[Math.floor(Math.random() * kycStatuses.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const circle = circles[Math.floor(Math.random() * circles.length)];
    
    // Generate realistic product count based on status
    let productCount = 0;
    if (status === 'Active' && kycStatus === 'Approved') {
      productCount = Math.floor(Math.random() * 150) + 10; // 10-160 products
    } else if (status === 'Pending') {
      productCount = Math.floor(Math.random() * 5); // 0-5 products
    }
    
    // Generate rating (only if has products)
    let rating = 0;
    let reviewCount = 0;
    if (productCount > 0) {
      rating = parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 to 5.0
      reviewCount = Math.floor(Math.random() * 200) + 5; // 5-205 reviews
    }
    
    const createdAt = randomDate();
    const lastActive = status === 'Active' ? recentDate() : null;
    
    // Only include fields that exist in the vendors table schema
    vendors.push({
      name: shopName,
      owner: ownerName,
      owner_name: ownerName,
      contact_number: contactNumber,
      email: email,
      state: location.state,
      city: location.city,
      town: location.town,
      tehsil: location.tehsil,
      sub_tehsil: location.subTehsil,
      circle: circle,
      category: category,
      status: status,
      kyc_status: kycStatus,
      created_at: createdAt.toISOString(),
      last_active: lastActive ? lastActive.toISOString() : null,
    });
  }
  
  return vendors;
}

// Main function
async function main() {
  try {
    console.log('🚀 Generating dummy users and vendors...\n');
    
    // Generate users
    console.log('📝 Generating users...');
    const users = generateUsers(50);
    console.log(`✅ Generated ${users.length} users`);
    
    // Generate vendors
    console.log('🏪 Generating vendors...');
    const vendors = generateVendors(30);
    console.log(`✅ Generated ${vendors.length} vendors`);
    
    // Insert users
    console.log('\n💾 Inserting users into Supabase...');
    try {
      // Insert in batches of 10 to avoid overwhelming the API
      for (let i = 0; i < users.length; i += 10) {
        const batch = users.slice(i, i + 10);
        await supabaseRestInsert('/rest/v1/users', batch);
        console.log(`  ✓ Inserted users ${i + 1}-${Math.min(i + 10, users.length)}`);
      }
      console.log(`✅ Successfully inserted ${users.length} users`);
    } catch (error) {
      console.error('❌ Error inserting users:', error.message);
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log('⚠️  Some users may already exist. Continuing...');
      } else {
        throw error;
      }
    }
    
    // Insert vendors
    console.log('\n💾 Inserting vendors into Supabase...');
    try {
      // Insert in batches of 10
      for (let i = 0; i < vendors.length; i += 10) {
        const batch = vendors.slice(i, i + 10);
        await supabaseRestInsert('/rest/v1/vendors', batch);
        console.log(`  ✓ Inserted vendors ${i + 1}-${Math.min(i + 10, vendors.length)}`);
      }
      console.log(`✅ Successfully inserted ${vendors.length} vendors`);
    } catch (error) {
      console.error('❌ Error inserting vendors:', error.message);
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log('⚠️  Some vendors may already exist. Continuing...');
      } else {
        throw error;
      }
    }
    
    console.log('\n✨ All dummy data inserted successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Vendors: ${vendors.length}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateUsers, generateVendors };
