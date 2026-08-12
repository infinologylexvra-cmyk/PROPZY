export interface PropertyItem {
  _id?: string;
  id: string;
  pid: string;
  title: string;
  category: 'rent' | 'buy' | 'sell' | 'pg' | 'commercial';
  type: 'house' | 'flat' | 'pg' | 'commercial' | 'plot';
  city: string;
  locality: string;
  address: string;
  price: number;
  deposit?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  furnishing: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  verified: boolean;
  featured: boolean;
  images: string[];
  description: string;
  amenities: string[];
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerRole: 'owner' | 'agent';
  available: boolean;
  createdAt: string;
}

export const INITIAL_PROPERTIES: PropertyItem[] = [
  {
    id: 'prop-101',
    pid: 'LR-101',
    title: 'Luxury 2 BHK Fully Furnished Flat in Sector 71',
    category: 'rent',
    type: 'flat',
    city: 'Mohali',
    locality: 'Sector 71',
    address: 'House #1240, Sector 71, Mohali, Punjab',
    price: 14500,
    deposit: 14500,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1100,
    furnishing: 'fully-furnished',
    verified: true,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Spacious & sunlit 2 BHK apartment in prime Sector 71, Mohali. Features modular kitchen, wooden wardrobes, AC in both rooms, power backup, and 24/7 security. 0% Brokerage.',
    amenities: ['Power Backup', 'Air Conditioner', 'Car Parking', 'Modular Kitchen', 'Wi-Fi', 'Balcony', 'Geyser'],
    ownerName: 'Harpreet Singh',
    ownerPhone: '+91 98765 43210',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-102',
    pid: 'LR-102',
    title: 'Independent 3 BHK Kothi Floor near IT Park',
    category: 'rent',
    type: 'house',
    city: 'Chandigarh',
    locality: 'Sector 35',
    address: 'House #450, Sector 35-C, Chandigarh',
    price: 24000,
    deposit: 24000,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 1800,
    furnishing: 'semi-furnished',
    verified: true,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'First floor of independent house with huge terrace balcony, attached washrooms, reserved stilt parking, and peaceful surroundings in Chandigarh heartland.',
    amenities: ['Terrace Access', 'Car Parking', 'Security Guard', 'Subsidized Water', 'Modular Kitchen', 'Parks Nearby'],
    ownerName: 'Vikas Sharma',
    ownerPhone: '+91 98123 98765',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-103',
    pid: 'LR-103',
    title: 'Premium Boys & Girls PG with 3 Times Meals',
    category: 'pg',
    type: 'pg',
    city: 'Kharar',
    locality: 'LPU & CU Highway',
    address: 'Near Chandigarh University Gate, Kharar',
    price: 7500,
    deposit: 5000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 350,
    furnishing: 'fully-furnished',
    verified: true,
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Fully air-conditioned single & double sharing PG rooms with hygienic home-cooked meals, high-speed fiber internet, RO drinking water, and daily housekeeping.',
    amenities: ['3 Meals Included', 'Wi-Fi 300 Mbps', 'Laundry', 'RO Water', 'AC', 'Housekeeping', 'CCTV'],
    ownerName: 'Gurpreet Kaur',
    ownerPhone: '+91 77196 69498',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-104',
    pid: 'LR-104',
    title: 'Modern 1 BHK Apartment in VIP Road',
    category: 'rent',
    type: 'flat',
    city: 'Zirakpur',
    locality: 'VIP Road',
    address: 'Savry Towers, VIP Road, Zirakpur',
    price: 9500,
    deposit: 9500,
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 650,
    furnishing: 'semi-furnished',
    verified: true,
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Cozy 1 BHK flat on VIP Road with round-the-clock water supply, elevator, gym access, and close proximity to shopping malls and supermarkets.',
    amenities: ['Elevator', 'Gym', 'Gated Security', 'Car Parking', 'Power Backup', 'Gas Pipeline'],
    ownerName: 'Rajesh Mehra',
    ownerPhone: '+91 94170 12345',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-105',
    pid: 'LR-105',
    title: 'Commercial Office Space in Sector 67',
    category: 'commercial',
    type: 'commercial',
    city: 'Mohali',
    locality: 'Sector 67',
    address: 'Bestech Business Tower, Sector 67, Mohali',
    price: 45000,
    deposit: 90000,
    bedrooms: 0,
    bathrooms: 2,
    areaSqFt: 1500,
    furnishing: 'fully-furnished',
    verified: true,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Furnished office space with 24 workstations, 2 conference rooms, director cabin, reception desk, server room, and central AC in prime Mohali IT hub.',
    amenities: ['Centralized AC', '100% Power Backup', '18 Car Parks', 'Conference Room', 'High Speed Lifts', 'Security Guards'],
    ownerName: 'Amit Kapoor',
    ownerPhone: '+91 99887 66554',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-106',
    pid: 'LR-106',
    title: '3 BHK Luxury Villa for Sale in Sector 20',
    category: 'buy',
    type: 'house',
    city: 'Panchkula',
    locality: 'Sector 20',
    address: 'Plot #89, Sector 20, Panchkula, Haryana',
    price: 18500000, // 1.85 Cr
    deposit: 0,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 2200,
    furnishing: 'unfurnished',
    verified: true,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Newly constructed freehold 3 BHK villa with modern exterior architecture, private lawn, modular fittings, and park-facing orientation in Panchkula.',
    amenities: ['Lawn Garden', 'Park Facing', 'Freehold Title', 'Modular Kitchen', 'Servant Quarter', '2 Car Driveway'],
    ownerName: 'Sunil Verma',
    ownerPhone: '+91 98140 55443',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-107',
    pid: 'LR-107',
    title: 'Furnished Room in 3 BHK Apartment',
    category: 'pg',
    type: 'flat',
    city: 'Mohali',
    locality: 'Sector 70',
    address: 'E-42, Sector 70, Mohali, Punjab',
    price: 11000,
    deposit: 11000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 400,
    furnishing: 'fully-furnished',
    verified: true,
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Single occupancy private room available for working professional male in a spacious 3 BHK apartment. Includes attached bathroom, AC, TV, and cook setup.',
    amenities: ['Private Bathroom', 'AC', 'Cook Available', 'Washing Machine', 'High-Speed Wi-Fi', 'Balcony'],
    ownerName: 'Rohan Gupta',
    ownerPhone: '+91 99100 88776',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-108',
    pid: 'LR-108',
    title: '2 BHK Builder Floor for Rent in Sector 62',
    category: 'rent',
    type: 'flat',
    city: 'Panchkula',
    locality: 'Sector 12',
    address: 'B-14, Sector 12, Panchkula, Haryana',
    price: 18000,
    deposit: 18000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1050,
    furnishing: 'semi-furnished',
    verified: true,
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'East-facing 2 BHK builder floor near markets and IT hubs in Sector 12 Panchkula. Gated society with ample green park views and dedicated parking.',
    amenities: ['Near Metro', 'Gated Society', 'Power Backup', 'Park Facing', 'Covered Parking'],
    ownerName: 'Anil Malhotra',
    ownerPhone: '+91 98111 22334',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-109',
    pid: 'LR-109',
    title: 'Luxury 3 BHK High-Rise Flat for Sale',
    category: 'buy',
    type: 'flat',
    city: 'Mohali',
    locality: 'Sector 70',
    address: 'Homeland Heights, Sector 70, Mohali',
    price: 8500000, // 85 Lakhs
    deposit: 0,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 1950,
    furnishing: 'fully-furnished',
    verified: true,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Premium 3 BHK flat in landmark society Homeland Heights Mohali. Club house, swimming pool, 3-tier security, and panoramic city views.',
    amenities: ['Club House', 'Swimming Pool', 'Gym', '3-Tier Security', 'Covered Parking', 'High Speed Lifts'],
    ownerName: 'Paramjit Singh',
    ownerPhone: '+91 98760 11223',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-110',
    pid: 'LR-110',
    title: '2 BHK Gated Society Flat for Sale on PR7 Airport Road',
    category: 'buy',
    type: 'flat',
    city: 'Zirakpur',
    locality: 'Airport Road',
    address: 'Maya Garden City, PR7 Airport Road, Zirakpur',
    price: 5500000, // 55 Lakhs
    deposit: 0,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1250,
    furnishing: 'semi-furnished',
    verified: true,
    featured: false,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Ready to move 2 BHK flat on main Airport Ring Road Zirakpur. Gated security, power backup, kids play area, and high investment return potential.',
    amenities: ['Power Backup', 'Kids Play Area', '24x7 Security', 'Elevator', 'Club House'],
    ownerName: 'Manish Sharma',
    ownerPhone: '+91 98150 99887',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-732',
    pid: 'LR-732',
    title: '2 BHK Flat for Rent in Sector 75',
    category: 'rent',
    type: 'flat',
    city: 'Mohali',
    locality: 'Sector 75',
    address: 'Sector 75, Mohali, Punjab',
    price: 12003,
    deposit: 12003,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1000,
    furnishing: 'semi-furnished',
    verified: true,
    featured: true,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Spacious 2 BHK flat for rent in Sector 75, Mohali with verified owner listing and direct 0% brokerage.',
    amenities: ['Power Backup', 'Car Parking', 'Modular Kitchen', 'Gated Security'],
    ownerName: 'Direct Owner',
    ownerPhone: '+91 98765 43210',
    ownerRole: 'owner',
    available: true,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_INQUIRIES = [
  { _id: 'inq-101', propertyId: 'prop-101', propertyTitle: '3 BHK Fully Furnished Kothi for Rent in Sector 70', propertyPid: 'LR-101', tenantName: 'Rahul Sharma', tenantPhone: '+91 98765 12345', tenantMessage: 'Hi, interested in family renting. Is power backup available?', status: 'pending', createdAt: new Date().toISOString() },
  { _id: 'inq-102', propertyId: 'prop-102', propertyTitle: 'Modern 2 BHK Flat in Homeland Heights', propertyPid: 'LR-102', tenantName: 'Priya Singh', tenantPhone: '+91 98140 99887', tenantMessage: 'Looking for urgent possession next week. Please call.', status: 'contacted', createdAt: new Date().toISOString() },
  { _id: 'inq-103', propertyId: 'prop-103', propertyTitle: 'Independent 1 BHK Builder Floor', propertyPid: 'LR-103', tenantName: 'Vikas Verma', tenantPhone: '+91 98722 33445', tenantMessage: 'Please call back with final security deposit terms.', status: 'pending', createdAt: new Date().toISOString() },
  { _id: 'inq-104', propertyId: 'prop-104', propertyTitle: 'Commercial Shop / Office Space', propertyPid: 'LR-104', tenantName: 'Gurpreet Singh', tenantPhone: '+91 98888 77665', tenantMessage: 'Need office space for IT startup.', status: 'pending', createdAt: new Date().toISOString() }
];
