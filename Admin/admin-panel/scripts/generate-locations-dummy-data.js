const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Location data structure (matching constants/locations.js)
const INDIAN_LOCATIONS = {
  "Delhi": {
    cities: {
      "New Delhi": {
        towns: {
          "Central Delhi": {
            tehsils: {
              "Connaught Place": {
                subTehsils: ["CP", "Janpath", "Parliament Street"]
              },
              "Chandni Chowk": {
                subTehsils: ["Old Delhi", "Red Fort", "Jama Masjid"]
              }
            }
          },
          "South Delhi": {
            tehsils: {
              "Saket": {
                subTehsils: ["Malviya Nagar", "Hauz Khas", "Green Park"]
              },
              "Vasant Kunj": {
                subTehsils: ["Vasant Vihar", "Munirka", "RK Puram"]
              }
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
              "Andheri": {
                subTehsils: ["Andheri East", "Andheri West", "Jogeshwari"]
              },
              "Bandra": {
                subTehsils: ["Bandra East", "Bandra West", "Khar"]
              }
            }
          },
          "Thane": {
            tehsils: {
              "Thane": {
                subTehsils: ["Thane West", "Thane East", "Kopri"]
              }
            }
          }
        }
      },
      "Pune": {
        towns: {
          "Pune": {
            tehsils: {
              "Pune City": {
                subTehsils: ["Shivajinagar", "Kothrud", "Hinjewadi"]
              }
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
              "Bangalore North": {
                subTehsils: ["Hebbal", "Yelahanka", "Yeshwanthpur"]
              },
              "Bangalore South": {
                subTehsils: ["Koramangala", "HSR Layout", "BTM Layout"]
              }
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
              "Ahmedabad City": {
                subTehsils: ["Navrangpura", "Maninagar", "Vastrapur"]
              }
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
              "Chennai North": {
                subTehsils: ["T Nagar", "Anna Nagar", "Kilpauk"]
              }
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
              "Kolkata North": {
                subTehsils: ["Salt Lake", "New Town", "Rajarhat"]
              }
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
              "Jaipur City": {
                subTehsils: ["Malviya Nagar", "Vaishali Nagar", "C Scheme"]
              }
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
              "Lucknow City": {
                subTehsils: ["Gomti Nagar", "Hazratganj", "Aliganj"]
              }
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
              "Hyderabad Central": {
                subTehsils: ["Banjara Hills", "Jubilee Hills", "Hitech City"]
              }
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
              "Chandigarh": {
                subTehsils: ["Sector 17", "Sector 35", "Sector 22"]
              }
            }
          }
        }
      }
    }
  }
};

// Helper function to get all locations
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

// Create output directory
const outputDir = path.join(__dirname, '../public/dummy-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Circle names for assignment
const circles = [
  'North Circle',
  'South Circle',
  'East Circle',
  'West Circle',
  'Central Circle',
  'Metro Circle',
  'Rural Circle',
  'Urban Circle',
];

// Generate locations data from constants
function generateLocationsData() {
  const allLocations = getAllLocations();
  const locationsData = [];
  
  // Assign circles to locations (distribute evenly)
  allLocations.forEach((loc, index) => {
    const circle = circles[index % circles.length];
    
    locationsData.push({
      'State': loc.state,
      'City': loc.city,
      'Town': loc.town,
      'Tehsil': loc.tehsil,
      'Sub-Tehsil': loc.subTehsil,
      'Circle': circle,
    });
  });
  
  return locationsData;
}

// Generate Excel file
function generateLocationsExcel() {
  const locations = generateLocationsData();
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(locations);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // State
    { wch: 20 }, // City
    { wch: 20 }, // Town
    { wch: 20 }, // Tehsil
    { wch: 20 }, // Sub-Tehsil
    { wch: 15 }, // Circle
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Locations');
  
  // Write file
  const filePath = path.join(outputDir, 'locations_dummy_data.xlsx');
  XLSX.writeFile(wb, filePath);
  
  console.log(`✅ Generated ${locations.length} locations in ${filePath}`);
  return filePath;
}

// Generate additional dummy locations (beyond what's in constants)
function generateExtendedLocationsData() {
  const extendedLocations = [];
  
  // Additional Indian states and cities
  const additionalStates = {
    'Haryana': {
      cities: {
        'Gurgaon': {
          towns: ['Gurgaon', 'Manesar', 'Sohna'],
          tehsils: ['Gurgaon City', 'Manesar', 'Sohna'],
          subTehsils: ['Sector 29', 'Sector 44', 'DLF Phase 1', 'DLF Phase 2', 'Cyber City', 'Sohna Road']
        },
        'Faridabad': {
          towns: ['Faridabad', 'Ballabgarh'],
          tehsils: ['Faridabad City', 'Ballabgarh'],
          subTehsils: ['Sector 15', 'Sector 21', 'NIT', 'Old Faridabad', 'Ballabgarh']
        }
      }
    },
    'Madhya Pradesh': {
      cities: {
        'Indore': {
          towns: ['Indore', 'Dewas'],
          tehsils: ['Indore City', 'Dewas'],
          subTehsils: ['Vijay Nagar', 'MG Road', 'Rajwada', 'Palasia', 'Dewas City']
        },
        'Bhopal': {
          towns: ['Bhopal'],
          tehsils: ['Bhopal City'],
          subTehsils: ['New Market', 'MP Nagar', 'Arera Colony', 'Shahpura']
        }
      }
    },
    'Odisha': {
      cities: {
        'Bhubaneswar': {
          towns: ['Bhubaneswar', 'Cuttack'],
          tehsils: ['Bhubaneswar City', 'Cuttack'],
          subTehsils: ['Nayapalli', 'Sahid Nagar', 'Unit 1', 'Unit 2', 'Cuttack City']
        }
      }
    },
    'Kerala': {
      cities: {
        'Kochi': {
          towns: ['Kochi', 'Ernakulam'],
          tehsils: ['Kochi City', 'Ernakulam'],
          subTehsils: ['Marine Drive', 'MG Road', 'Fort Kochi', 'Ernakulam City']
        },
        'Thiruvananthapuram': {
          towns: ['Thiruvananthapuram'],
          tehsils: ['Thiruvananthapuram City'],
          subTehsils: ['Kowdiar', 'Vellayambalam', 'Pattom', 'Sreekaryam']
        }
      }
    },
    'Assam': {
      cities: {
        'Guwahati': {
          towns: ['Guwahati'],
          tehsils: ['Guwahati City'],
          subTehsils: ['Paltan Bazaar', 'Fancy Bazaar', 'Beltola', 'Dispur']
        }
      }
    },
    'Jharkhand': {
      cities: {
        'Ranchi': {
          towns: ['Ranchi'],
          tehsils: ['Ranchi City'],
          subTehsils: ['Main Road', 'Lalpur', 'Doranda', 'Harmu']
        },
        'Jamshedpur': {
          towns: ['Jamshedpur'],
          tehsils: ['Jamshedpur City'],
          subTehsils: ['Bistupur', 'Sakchi', 'Kadma', 'Sonari']
        }
      }
    }
  };
  
  // Generate locations from additional states
  Object.keys(additionalStates).forEach(state => {
    const stateData = additionalStates[state];
    Object.keys(stateData.cities).forEach(city => {
      const cityData = stateData.cities[city];
      cityData.towns.forEach((town, townIndex) => {
        const tehsil = cityData.tehsils[townIndex] || cityData.tehsils[0];
        cityData.subTehsils.forEach(subTehsil => {
          const circle = circles[Math.floor(Math.random() * circles.length)];
          extendedLocations.push({
            'State': state,
            'City': city,
            'Town': town,
            'Tehsil': tehsil,
            'Sub-Tehsil': subTehsil,
            'Circle': circle,
          });
        });
      });
    });
  });
  
  return extendedLocations;
}

// Generate extended locations Excel
function generateExtendedLocationsExcel() {
  const baseLocations = generateLocationsData();
  const extendedLocations = generateExtendedLocationsData();
  const allLocations = [...baseLocations, ...extendedLocations];
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(allLocations);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // State
    { wch: 20 }, // City
    { wch: 20 }, // Town
    { wch: 20 }, // Tehsil
    { wch: 20 }, // Sub-Tehsil
    { wch: 15 }, // Circle
  ];
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Locations');
  
  // Write file
  const filePath = path.join(outputDir, 'locations_dummy_data_extended.xlsx');
  XLSX.writeFile(wb, filePath);
  
  console.log(`✅ Generated ${allLocations.length} locations (${baseLocations.length} base + ${extendedLocations.length} extended) in ${filePath}`);
  return filePath;
}

// Main execution
if (require.main === module) {
  console.log('Generating locations dummy data...\n');
  
  try {
    generateLocationsExcel();
    generateExtendedLocationsExcel();
    
    console.log('\n✅ All location dummy data files generated successfully!');
    console.log('\nFiles created:');
    console.log('  - locations_dummy_data.xlsx (from constants)');
    console.log('  - locations_dummy_data_extended.xlsx (with additional locations)');
    console.log('\nYou can now import these files using the Location Management import feature.');
  } catch (error) {
    console.error('❌ Error generating locations dummy data:', error);
    process.exit(1);
  }
}

module.exports = {
  generateLocationsData,
  generateExtendedLocationsData,
  generateLocationsExcel,
  generateExtendedLocationsExcel,
};
