const User = require('./models/User');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const Review = require('./models/Review');

const INITIAL_USERS = [
  {
    id: 'cust-1',
    name: 'Jane Doe',
    email: 'customer@hotelease.com',
    password: 'password',
    role: 'customer',
    balance: 5000,
    active: true,
    joinedDate: '2026-01-15'
  },
  {
    id: 'owner-1',
    name: 'John Smith',
    email: 'owner@hotelease.com',
    password: 'password',
    role: 'owner',
    balance: 0,
    active: true,
    joinedDate: '2026-02-10'
  },
  {
    id: 'admin-1',
    name: 'Alex Johnson',
    email: 'admin@hotelease.com',
    password: 'password',
    role: 'admin',
    balance: 0,
    active: true,
    joinedDate: '2026-01-01'
  }
];

const INITIAL_HOTELS = [
  {
    id: 'hotel-1',
    name: 'Grand Hyatt Regency',
    location: 'New York, NY',
    description: 'Experience absolute luxury in the heart of Manhattan. Featuring a spectacular rooftop bar, heated skyline pool, five-star Michelin restaurants, and ultra-modern wellness centers. Perfect for both business executives and vacationers seeking premier comfort.',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    amenities: ['Wifi', 'Pool', 'Gym', 'Spa', 'Bar', 'Restaurant', 'Parking'],
    approved: true,
    ownerId: 'owner-1'
  },
  {
    id: 'hotel-2',
    name: 'Beachside Sanctuary Resort',
    location: 'Miami, FL',
    description: 'Steps away from the soft white sands and turquoise waters of South Beach. Relax in our private pool cabanas, enjoy oceanfront tropical dining, and indulge in beachfront yoga sessions. Escape the ordinary and embrace the tranquil ocean breeze.',
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    amenities: ['Wifi', 'Pool', 'Beach Access', 'Bar', 'Restaurant', 'Parking', 'Pets Welcome'],
    approved: true,
    ownerId: 'owner-1'
  },
  {
    id: 'hotel-3',
    name: 'Alpine Ridge Lodge',
    location: 'Aspen, CO',
    description: 'Cozy fireside cabins and luxury timber suites situated at the base of Aspen Mountain. Experience ski-in/ski-out convenience, wind down in our outdoor heated hot tub under the stars, or gather around the central firepit for evening s\'mores.',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    amenities: ['Wifi', 'Fireplace', 'Hot Tub', 'Gym', 'Ski Storage', 'Parking'],
    approved: true,
    ownerId: 'owner-1'
  },
  {
    id: 'hotel-4',
    name: 'Kyoto Zen Gardens Pavilion',
    location: 'Kyoto, Japan',
    description: 'A serene sanctuary featuring authentic wooden architecture, beautifully manicured moss gardens, and meditative rock structures. Enjoy tea ceremonies hosted by masters and local seasonal Kaiseki dining in a quiet, historic neighborhood.',
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?auto=format&fit=crop&w=800&q=80',
    amenities: ['Wifi', 'Garden', 'Spa', 'Tea Room', 'Breakfast Included'],
    approved: true,
    ownerId: 'owner-1'
  },
  {
    id: 'hotel-5',
    name: 'Varanasi Heritage Palace',
    location: 'Varanasi, India',
    description: 'A meticulously restored 18th-century palace rising above the sacred Ganga river. Experience royal historic suites, traditional evening music recitals, yoga decks overlooking the ghats, and exquisite Awadhi cuisine.',
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=800&q=80',
    amenities: ['Wifi', 'River View', 'Spa', 'Restaurant', 'Yoga Deck', 'AC'],
    approved: false,
    ownerId: 'owner-1'
  }
];

const INITIAL_ROOMS = [
  {
    id: 'room-1-1',
    hotelId: 'hotel-1',
    type: 'Deluxe Cityview',
    price: 250,
    occupancy: 2,
    amenities: ['King Bed', 'Skyline View', 'Mini Bar', 'Smart TV'],
    totalRooms: 10,
    availableRooms: 8
  },
  {
    id: 'room-1-2',
    hotelId: 'hotel-1',
    type: 'Presidential Suite',
    price: 650,
    occupancy: 4,
    amenities: ['2 King Beds', 'Panoramic View', 'Jacuzzi', 'Kitchenette', 'Espresso Machine'],
    totalRooms: 3,
    availableRooms: 3
  },
  {
    id: 'room-2-1',
    hotelId: 'hotel-2',
    type: 'Oceanfront Villa',
    price: 420,
    occupancy: 3,
    amenities: ['King Bed', 'Private Balcony', 'Sea View', 'Outdoor Shower'],
    totalRooms: 5,
    availableRooms: 4
  },
  {
    id: 'room-2-2',
    hotelId: 'hotel-2',
    type: 'Standard King',
    price: 210,
    occupancy: 2,
    amenities: ['King Bed', 'Garden View', 'Mini Fridge'],
    totalRooms: 12,
    availableRooms: 10
  },
  {
    id: 'room-3-1',
    hotelId: 'hotel-3',
    type: 'Timber Cabin Loft',
    price: 340,
    occupancy: 4,
    amenities: ['Queen Bed + Loft Sleeper', 'Fireplace', 'Mountain View', 'Kitchen'],
    totalRooms: 6,
    availableRooms: 5
  },
  {
    id: 'room-4-1',
    hotelId: 'hotel-4',
    type: 'Tatami Garden Room',
    price: 190,
    occupancy: 2,
    amenities: ['Traditional Futons', 'Zen Garden Terrace', 'Yukata Robes'],
    totalRooms: 8,
    availableRooms: 7
  },
  {
    id: 'room-5-1',
    hotelId: 'hotel-5',
    type: 'Maharaja Royal Suite',
    price: 380,
    occupancy: 2,
    amenities: ['Four-poster King Bed', 'Ganga River Balcony', 'Heritage Bath'],
    totalRooms: 4,
    availableRooms: 4
  }
];

const INITIAL_BOOKINGS = [
  {
    id: 'book-1',
    hotelId: 'hotel-1',
    roomId: 'room-1-1',
    customerId: 'cust-1',
    customerName: 'Jane Doe',
    checkIn: '2026-06-10',
    checkOut: '2026-06-14',
    guests: 2,
    totalCost: 1000,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    createdAt: '2026-05-20'
  },
  {
    id: 'book-2',
    hotelId: 'hotel-2',
    roomId: 'room-2-2',
    customerId: 'cust-1',
    customerName: 'Jane Doe',
    checkIn: '2026-05-01',
    checkOut: '2026-05-04',
    guests: 1,
    totalCost: 630,
    status: 'CheckedOut',
    paymentStatus: 'Paid',
    createdAt: '2026-04-12'
  }
];

const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    hotelId: 'hotel-1',
    customerId: 'cust-1',
    customerName: 'Jane Doe',
    rating: 5,
    comment: 'Absolutely spectacular! The rooftop view was stunning and the customer service went above and beyond.',
    date: '2026-05-15'
  },
  {
    id: 'rev-2',
    hotelId: 'hotel-2',
    customerId: 'cust-1',
    customerName: 'Jane Doe',
    rating: 4,
    comment: 'Wonderful beach access and spacious rooms. The food at the restaurant was a bit pricey but delicious.',
    date: '2026-05-05'
  }
];

async function runSeeder() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Hotel.deleteMany({});
    await Room.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});

    // Seed collections
    await User.insertMany(INITIAL_USERS);
    await Hotel.insertMany(INITIAL_HOTELS);
    await Room.insertMany(INITIAL_ROOMS);
    await Booking.insertMany(INITIAL_BOOKINGS);
    await Review.insertMany(INITIAL_REVIEWS);

    console.log('Seeder run successful!');
  } catch (err) {
    console.error('Error running seeder script:', err);
    throw err;
  }
}

module.exports = runSeeder;
