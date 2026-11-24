
import bcrypt from "bcryptjs";
import { pool } from "../src/config/database";

const DEMO_PASSWORD = "Password@123";
const OWNER_COUNT = 24;
const BATCH_SIZE = 5000;

const countArgument = process.argv.find((arg) => arg.startsWith("--count="));
const TOTAL_PROPERTIES = countArgument ? Number(countArgument.split("=")[1]) : 50_000;

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = createRandom(42);
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

interface CityData {
  city: string;
  state: string;
  pinPrefix: string;
  priceFactor: number;
  localities: string[];
}

const CITIES: CityData[] = [
  { city: "Mumbai", state: "Maharashtra", pinPrefix: "4000", priceFactor: 2.6, localities: ["Andheri West", "Bandra West", "Powai", "Thane West", "Malad West", "Borivali East", "Chembur", "Navi Mumbai"] },
  { city: "Delhi", state: "Delhi", pinPrefix: "1100", priceFactor: 1.8, localities: ["Dwarka", "Rohini", "Saket", "Vasant Kunj", "Pitampura", "Janakpuri", "Lajpat Nagar", "Mayur Vihar"] },
  { city: "Bengaluru", state: "Karnataka", pinPrefix: "5600", priceFactor: 1.5, localities: ["Whitefield", "Koramangala", "HSR Layout", "Indiranagar", "Electronic City", "Hebbal", "Marathahalli", "Jayanagar"] },
  { city: "Hyderabad", state: "Telangana", pinPrefix: "5000", priceFactor: 1.2, localities: ["Gachibowli", "Madhapur", "Kondapur", "Kukatpally", "Banjara Hills", "Miyapur", "Kokapet", "Uppal"] },
  { city: "Chennai", state: "Tamil Nadu", pinPrefix: "6000", priceFactor: 1.1, localities: ["Adyar", "Velachery", "OMR", "Anna Nagar", "Tambaram", "Porur", "T Nagar", "Sholinganallur"] },
  { city: "Pune", state: "Maharashtra", pinPrefix: "4110", priceFactor: 1.2, localities: ["Hinjewadi", "Kharadi", "Baner", "Wakad", "Hadapsar", "Viman Nagar", "Kothrud", "Pimple Saudagar"] },
  { city: "Kolkata", state: "West Bengal", pinPrefix: "7000", priceFactor: 0.9, localities: ["Salt Lake", "New Town", "Behala", "Garia", "Dum Dum", "Ballygunge", "Howrah", "Tollygunge"] },
  { city: "Ahmedabad", state: "Gujarat", pinPrefix: "3800", priceFactor: 0.8, localities: ["Satellite", "Bopal", "Prahlad Nagar", "Maninagar", "Gota", "Thaltej", "Vastrapur", "Chandkheda"] },
  { city: "Gurugram", state: "Haryana", pinPrefix: "1220", priceFactor: 1.7, localities: ["Sector 56", "Golf Course Road", "Sohna Road", "DLF Phase 3", "Sector 82", "Manesar", "Sushant Lok", "Sector 49"] },
  { city: "Noida", state: "Uttar Pradesh", pinPrefix: "2013", priceFactor: 1.0, localities: ["Sector 62", "Sector 137", "Greater Noida West", "Sector 75", "Sector 150", "Sector 18", "Sector 50", "Sector 120"] },
  { city: "Jaipur", state: "Rajasthan", pinPrefix: "3020", priceFactor: 0.7, localities: ["Vaishali Nagar", "Mansarovar", "Malviya Nagar", "Jagatpura", "C Scheme", "Tonk Road", "Ajmer Road", "Sodala"] },
  { city: "Kochi", state: "Kerala", pinPrefix: "6820", priceFactor: 0.9, localities: ["Kakkanad", "Edappally", "Marine Drive", "Vyttila", "Aluva", "Palarivattom", "Thrippunithura", "Fort Kochi"] },
  { city: "Chandigarh", state: "Chandigarh", pinPrefix: "1600", priceFactor: 1.1, localities: ["Sector 17", "Sector 22", "Sector 35", "Manimajra", "Sector 43", "Sector 8", "Sector 44", "Industrial Area"] },
  { city: "Lucknow", state: "Uttar Pradesh", pinPrefix: "2260", priceFactor: 0.6, localities: ["Gomti Nagar", "Hazratganj", "Indira Nagar", "Alambagh", "Aliganj", "Jankipuram", "Chinhat", "Mahanagar"] },
  { city: "Vellore", state: "Tamil Nadu", pinPrefix: "6320", priceFactor: 0.45, localities: ["Katpadi", "Gandhi Nagar", "Sathuvachari", "Bagayam", "Thorapadi", "Vellore Fort", "Ariyur", "Kaspa"] },
];

const AMENITIES = ["Parking", "Lift", "Power Backup", "Gym", "Swimming Pool", "Security", "Clubhouse", "Garden", "Children's Play Area", "Water Supply 24x7", "Gas Pipeline", "Visitor Parking"];

type PropertyType = "apartment" | "house" | "villa" | "plot" | "commercial";
const TYPE_WEIGHTS: PropertyType[] = [
  ...Array<PropertyType>(11).fill("apartment"), ...Array<PropertyType>(3).fill("house"),
  ...Array<PropertyType>(2).fill("villa"), ...Array<PropertyType>(2).fill("plot"), ...Array<PropertyType>(2).fill("commercial"),
];

interface GeneratedProperty {
  ownerIndex: number; title: string; description: string; propertyType: PropertyType; listingType: "sale" | "rent";
  price: number; bedrooms: number; bathrooms: number; areaSqft: number; addressLine: string; locality: string;
  city: string; state: string; pincode: string; amenities: string; createdAt: string;
}

function generateProperty(): GeneratedProperty {
  const location = pick(CITIES);
  const locality = pick(location.localities);
  const propertyType = pick(TYPE_WEIGHTS);
  const listingType = random() < 0.65 ? "sale" : "rent";

  let bedrooms = 0;
  let areaSqft: number;
  switch (propertyType) {
    case "apartment": bedrooms = between(1, 4); areaSqft = 350 + bedrooms * between(250, 450); break;
    case "house": bedrooms = between(2, 5); areaSqft = between(900, 3000); break;
    case "villa": bedrooms = between(3, 6); areaSqft = between(1800, 6000); break;
    case "plot": areaSqft = between(600, 6000); break;
    default: areaSqft = between(300, 5000);
  }
  const bathrooms = propertyType === "plot" ? 0 : propertyType === "commercial" ? between(1, 4) : Math.max(1, bedrooms - between(0, 1));

  const typeMultiplier = { apartment: 1, house: 1.1, villa: 1.5, plot: 0.7, commercial: 1.4 }[propertyType];
  let price: number;
  if (listingType === "sale") {
    price = Math.round((areaSqft * between(4000, 9000) * location.priceFactor * typeMultiplier) / 10_000) * 10_000;
  } else {
    price = Math.round((areaSqft * between(18, 40) * location.priceFactor * typeMultiplier) / 500) * 500;
  }
  price = Math.max(price, listingType === "sale" ? 100_000 : 500);

  const typeLabel = { apartment: "Apartment", house: "Independent House", villa: "Villa", plot: "Residential Plot", commercial: "Commercial Space" }[propertyType];
  const bhk = propertyType === "apartment" || propertyType === "house" || propertyType === "villa" ? `${bedrooms} BHK ` : "";
  const title = `${bhk}${typeLabel} for ${listingType === "sale" ? "Sale" : "Rent"} in ${locality}, ${location.city}`;

  const amenityList = AMENITIES.filter(() => random() < 0.35).slice(0, 8);
  const description =
    `Well-maintained ${typeLabel.toLowerCase()} of ${areaSqft} sq ft in ${locality}, ${location.city}. ` +
    `Close to schools, hospitals, markets and public transport. ` +
    (propertyType === "plot" ? "Clear title, ready for construction." : "Bright rooms with good ventilation and a peaceful neighbourhood.") +
    ` Contact the owner to schedule a visit.`;

  const daysAgo = random() * 365;
  return {
    ownerIndex: between(0, OWNER_COUNT),
    title, description, propertyType, listingType, price, bedrooms, bathrooms, areaSqft,
    addressLine: `${between(1, 250)}, ${locality} Main Road`,
    locality, city: location.city, state: location.state,
    pincode: `${location.pinPrefix}${between(10, 99)}`,
    amenities: amenityList.join(","),
    createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  };
}

async function createUsers(): Promise<number[]> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const emails = ["demo@estatehub.test", ...Array.from({ length: OWNER_COUNT }, (_, i) => `owner${i + 1}@estatehub.test`)];

  const ids: number[] = [];
  for (const [index, email] of emails.entries()) {
    const name = index === 0 ? "Demo User" : `Owner ${index}`;
    const { rows } = await pool.query<{ id: number; }>(
      `INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4)
       ON CONFLICT (lower(email)) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name, email, `98765${String(10000 + index).slice(-5)}`, passwordHash],
    );
    ids.push(rows[0].id);
  }
  return ids;
}

async function insertBatch(ownerIds: number[], batch: GeneratedProperty[]) {

  const column = <K extends keyof GeneratedProperty>(key: K) => batch.map((item) => item[key]);
  await pool.query(
    `INSERT INTO properties
       (owner_id, title, description, property_type, listing_type, price, bedrooms, bathrooms,
        area_sqft, address_line, locality, city, state, pincode, amenities, created_at, updated_at)
     SELECT t.owner_id, t.title, t.description, t.property_type, t.listing_type, t.price, t.bedrooms, t.bathrooms,
            t.area_sqft, t.address_line, t.locality, t.city, t.state, t.pincode,
            CASE WHEN t.amenities = '' THEN '{}'::text[] ELSE string_to_array(t.amenities, ',') END,
            t.created_at, t.created_at
       FROM unnest($1::bigint[], $2::text[], $3::text[], $4::text[], $5::text[], $6::bigint[], $7::smallint[], $8::smallint[],
                   $9::int[], $10::text[], $11::text[], $12::text[], $13::text[], $14::text[], $15::text[], $16::timestamptz[])
            AS t(owner_id, title, description, property_type, listing_type, price, bedrooms, bathrooms,
                 area_sqft, address_line, locality, city, state, pincode, amenities, created_at)`,
    [
      column("ownerIndex").map((index) => ownerIds[index]), column("title"), column("description"),
      column("propertyType"), column("listingType"), column("price"), column("bedrooms"), column("bathrooms"),
      column("areaSqft"), column("addressLine"), column("locality"), column("city"), column("state"),
      column("pincode"), column("amenities"), column("createdAt"),
    ],
  );
}

async function main() {
  const started = Date.now();
  const ownerIds = await createUsers();
  console.log(`Demo users ready (${ownerIds.length}). Password for all: ${DEMO_PASSWORD}`);

  for (let inserted = 0; inserted < TOTAL_PROPERTIES; inserted += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TOTAL_PROPERTIES - inserted);
    await insertBatch(ownerIds, Array.from({ length: size }, generateProperty));
    console.log(`  inserted ${inserted + size} / ${TOTAL_PROPERTIES}`);
  }

  await pool.query("ANALYZE properties");
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
