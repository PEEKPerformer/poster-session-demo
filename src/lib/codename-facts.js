// Fun facts keyed by attendee code, shown in the welcome tutorial
// Every NERPG attendee gets a personalized rubber/polymer tidbit

const FACTS = {
  // Admin
  ADMN:   'You run the show!',

  // Presenters
  GREEN:  'Green rubber compounding uses bio-based oils and sustainable fillers to cut petroleum dependence.',
  OZONE:  'Ozone cracking is rubber\'s invisible enemy. Even parts-per-billion concentrations attack double bonds.',
  ALLOY:  'Polymer alloys blend immiscible rubbers to combine the best properties of each.',
  MORPH:  'Morphology controls everything: the shape of dispersed phases determines blend performance.',
  SPOOL:  'Tire cord is wound on spools at over 200 m/min before being calendered into rubber.',
  FIBER:  'Short fiber reinforcement can double a rubber compound\'s modulus at just 10 phr loading.',
  CHAIN:  'A single polyisoprene chain in natural rubber can contain over 30,000 isoprene units.',
  COIL:   'Polymer chains coil into random configurations. Stretching uncoils them, and they snap back.',
  GLASS:  'The glass transition temperature is where rubber stops being rubbery and becomes a rigid glass.',

  // Students / Faculty
  BLOOM:  'Bloom is when wax or sulfur migrates to a rubber surface: ugly, but often intentional protection.',
  BLEND:  'Rubber blends like NR/BR combine the processability of one with the wear resistance of the other.',
  BATCH:  'A typical Banbury batch weighs 200 to 400 lbs and mixes in under 5 minutes.',
  BEAD:   'Tire beads are steel wire hoops that lock the tire to the rim under 35+ psi of pressure.',
  BELT:   'Steel-belted radials revolutionized tires in the 1960s, doubling tread life overnight.',
  AMBER:  'Amber is fossilized tree resin: nature\'s original polymer, preserved for 40 million years.',
  PLAST:  'Plasticizers can cut a rubber compound\'s viscosity in half, making it flow through dies easily.',
  CREEP:  'Creep is slow, permanent deformation under load. That\'s why old rubber bushings eventually sag.',
  GLOSS:  'Surface gloss in rubber is controlled by mold finish. Polished steel gives mirror-like parts.',

  // Attendee codes: Rubber processing
  CURE:   'Charles Goodyear discovered vulcanization by accidentally dropping rubber and sulfur on a hot stove in 1839.',
  VULC:   'Vulcanization was named after Vulcan, the Roman god of fire and forge.',
  MOLD:   'Compression molding, the oldest rubber forming method, dates back to the 1850s.',
  PRESS:  'A typical rubber press applies 200+ tons of clamping force to keep molds shut during cure.',
  KNEAD:  'Internal mixers knead rubber with rotors spinning at different speeds to maximize shear.',
  MILL:   'The two-roll mill was the rubber industry\'s primary mixer for over a century before the Banbury.',
  CAST:   'Liquid casting silicones can reproduce surface detail finer than 1 micron.',
  GRAFT:  'Graft copolymers act as molecular surfactants, compatibilizing immiscible rubber blends.',
  MELT:   'Thermoplastic elastomers can be melted and reshaped. Unlike thermoset rubber, they\'re recyclable.',
  FLOW:   'Rubber doesn\'t flow like water. It\'s a non-Newtonian fluid that thins under shear.',
  SPIN:   'Spandex (elastane) fibers are dry-spun from solution at speeds over 500 m/min.',

  // Properties & testing
  FLEX:   'A tire sidewall flexes over 800 times per mile. Flex fatigue is a critical design factor.',
  SHEAR:  'Shear modulus is what lets rubber engine mounts absorb vibration in every direction.',
  TEAR:   'Tear strength of natural rubber can exceed 100 kN/m thanks to strain crystallization.',
  SWELL:  'Immersing rubber in solvent measures crosslink density: more swelling means fewer crosslinks.',
  YIELD:  'Unlike metals, most rubbers have no yield point. They\'re elastic to several hundred percent strain.',
  SHORE:  'Shore A hardness of 60 is the sweet spot for most rubber seals and gaskets.',
  TACK:   'Building tack lets uncured rubber plies stick together during tire building, no adhesive needed.',
  PEEL:   'The 180-degree peel test measures how well rubber bonds to fabric, cord, or metal.',
  CREPE:  'Crepe rubber (wrinkled sheets of coagulated latex) was the original form of commercial NR.',
  SNAP:   'Snap-back resilience testing drops a pendulum onto rubber and measures the rebound energy.',

  // New textbook codes
  SCORCH: 'Scorch is every compounder\'s nightmare: premature vulcanization that ruins an entire batch.',
  MOONEY: 'The Mooney viscometer, invented in 1934, is still the #1 processability test in every rubber lab.',
  HEVEA:  'Hevea brasiliensis, the rubber tree, produces 80% of the world\'s natural rubber from its bark.',
  VITON:  'Viton fluoroelastomer survives 400\u00B0F and resists nearly every chemical. The gold standard of seals.',
  EPDM:   'EPDM rubber lines your car\'s weatherstripping, garden hose, and maybe even your roof.',
  GOODY:  'Charles Goodyear spent years in debtors\' prison before discovering vulcanization. Persistence paid off.',
  AKRON:  'Akron, Ohio was once home to all four major tire companies: the Rubber Capital of the World.',
  PICKLE: 'Thomas Hancock\'s "Pickle" (1820) was the world\'s first rubber mixer. He named it to confuse spies.',
  PRENE:  'The "-prene" suffix unites rubber\'s royal family: neoprene, isoprene, and chloroprene.',
  EBONI:  'Ebonite (rubber cured with 30%+ sulfur) was used for bowling balls, fountain pens, and phone handsets.',
  CRYO:   'Cryogenic grinding freezes rubber to -120\u00B0C with liquid nitrogen, then shatters it into fine powder.',
  KRATO:  'Kraton block copolymers are thermoplastic rubbers found in shoe soles, pressure-sensitive adhesives, and road-marking compounds.',
  FLORY:  'Paul Flory won the 1974 Nobel Prize for proving polymers are real molecules, not colloids.',
  NATTA:  'Giulio Natta\'s stereospecific catalysts made polypropylene possible. Nobel Prize, 1963.',
  NERVY:  'Nervy rubber is so elastic on the mill it won\'t band the roll. A compounder\'s colorful term.',
  FACTIS: 'Factice (vulcanized vegetable oil) is the secret ingredient that makes erasers erase.',
  DICUP:  'Dicumyl peroxide (DiCup) creates carbon-carbon crosslinks that outperform sulfur bonds at high temps.',
  SILOX:  'The siloxane bond (Si-O) is roughly 25% stronger than C-C. That\'s why silicone rubber handles extreme heat.',
  DIENE:  'Conjugated dienes (two double bonds separated by one single bond) are the backbone of all synthetic rubber.',
  SKID:   'Skid resistance depends on rubber\'s viscoelastic loss factor. Softer treads grip wet roads better.',
  SKOR:   'SKOR = "Some Kind Of Rubber," shop-floor slang for mystery compounds that show up without a spec sheet.',
  ORING:  'The O-ring is the most-produced elastomeric part in history. Billions made each year.',
  TMTD:   'TMTD was one of the first organic accelerators. It cut vulcanization time from hours to minutes.',
  PEROX:  'Peroxide-cured rubber has superior heat aging because C-C crosslinks don\'t revert like sulfur ones.',
  SILICA: 'Precipitated silica in tire treads cut rolling resistance 20%, launching the "green tire" revolution.',

  // Staying codes: Polymer science
  CROSS:  'A single cubic centimeter of vulcanized rubber contains billions of sulfur crosslink bridges.',
  BOND:   'Rubber-to-metal bonding uses brass-plated steel. The copper-sulfur reaction creates an unbreakable joint.',
  PHASE:  'Phase-separated block copolymers self-assemble into nano-patterns: nature\'s own lithography.',
  POLY:   'The word "polymer" comes from Greek: poly (many) + meros (parts).',
  GEL:    'Gel content measures the insoluble crosslinked fraction, the skeleton of vulcanized rubber.',
  ELAST:  'Elastomers can stretch 500 to 1000% and snap back. No other material class comes close.',
  HELIX:  'Natural rubber\'s cis-1,4 backbone coils into a helix that crystallizes when stretched, giving it record tensile strength.',

  // Chemistry
  VINYL:  'Vinyl content in polybutadiene controls its glass transition. More vinyl means better wet grip.',
  EPOXY:  'Epoxidized natural rubber grips wet roads like silica-filled compounds: a tropical two-for-one.',
  AMINE:  'Amine antidegradants are the most effective rubber protectants, but they stain. Dark parts only.',
  ESTER:  'Ester plasticizers improve low-temperature flex in nitrile and polychloroprene rubber.',
  THIOL:  'Thiol groups are the active species in mercaptobenzothiazole, the world\'s most-used accelerator class.',
  ETHER:  'Ether linkages give epichlorohydrin rubber outstanding ozone and fuel resistance.',
  ZINC:   'Zinc oxide is in virtually every rubber compound. Just 5 phr activates the sulfur cure system.',

  // Materials
  LATEX:  'Natural rubber latex is harvested before dawn. That\'s when Hevea trees give the highest yield.',
  RESIN:  'Phenolic resins boost rubber hardness past 90 Shore A while keeping flexibility.',
  FOAM:   'Dunlop latex foam (1929) revolutionized mattresses: whipped latex like cake batter, then vulcanized it.',
  NYLON:  'Nylon tire cord replaced cotton in the 1940s, cutting tire weight and boosting speed ratings.',
  BUTYL:  'Butyl rubber is 10x more impermeable to air than NR. That\'s why it lines every tire innerliner.',
  BUNA:   'BUNA = BUtadiene + NAtrium (sodium catalyst). Germany\'s 1930s synthetic rubber breakthrough.',
  BLACK:  'Carbon black reinforces rubber so dramatically that adding it can multiply tensile strength by 10x.',
  CLAY:   'Kaolin clay is the go-to non-black filler. It gives rubber a clean white or colored appearance.',

  // Products
  SEAL:   'Rubber seals keep fluids in and contaminants out. Your car has hundreds of them.',
  TREAD:  'A passenger tire tread compound contains 10+ ingredients precisely balanced for grip, wear, and efficiency.',
  TIRE:   'A modern radial tire contains over 200 raw materials and 20+ distinct rubber compounds.',
  HOSE:   'Hydraulic hoses carry fluid at 5,000+ psi. Layers of rubber and braided steel make it possible.',
  FILM:   'Thin rubber films in medical gloves are just 0.1 mm thick yet stretch to 700%.',

  // Legends & measurements
  POISE:  'The poise is the CGS unit of viscosity, named after Jean Poiseuille who studied blood flow.',
  WELD:   'Weld lines form where two rubber flow fronts meet in a mold: the weakest spot in the part.',
  CORD:   'A single steel tire cord is just 0.25 mm thick but supports 25+ kg of load.',

  // Board members
  ROTOR:  'The Banbury mixer rotor has been churning polymer since 1916. Over a century of mixing muscle.',
  FLOC:   'Flocculation clumps latex particles together during coagulation. Small forces, big impact.',
  GUTTA:  'Gutta percha (trans-polyisoprene) coated the first transatlantic telegraph cable in 1858.',
  CALEND: 'Calendering squeezes rubber into thin sheets between heated steel rolls at up to 100 m/min.',
  SCREW:  'The extruder screw is the heart of continuous rubber processing. On a mid-size machine, one turn moves roughly a pound of compound.',
  SHRED:  'Tire shredding is step one of rubber recycling. 300 million scrap tires per year in the US alone.',
  KEVLAR: 'Kevlar (poly-paraphenyleneterephthalamide) is five times stronger than steel by weight.',
  VULCUP: 'Vul-Cup peroxide creates ultra-stable C-C crosslinks for high-temperature rubber applications.',
  PAYNE:  'The Payne effect: filled rubber gets softer with increasing strain. Every tire engineer studies it.',
  MBTS:   'MBTS (mercaptobenzothiazole disulfide) is the workhorse delayed-action accelerator in sulfur cure.',
  QUENCH: 'Quenching freezes carbon black particle size mid-formation. Milliseconds determine the final grade.',
  FROTH:  'Frothing whips air into latex to make foam rubber. The Dunlop process (1929) made mattresses soft.',
  MULLIN: 'The Mullins effect: rubber softens permanently after its first big stretch. Named after Leonard Mullins.',
  REDOX:  'Redox chemistry at 5C made cold-emulsion SBR possible, replacing the inferior hot process in the 1940s.',
  ELONG:  'Elongation at break for natural rubber can exceed 800%. Few materials stretch that far and survive.',
  RESIL:  'Resilience measures rebound energy. A super ball returns 90% of its drop height thanks to high resilience.',
  HYSTER: 'Hysteresis is energy lost as heat per deformation cycle. Low hysteresis = fuel-efficient tires.',
  ERASR:  'The eraser is NR + factice (vulcanized vegetable oil). Factice absorbs graphite by capillary action.',
}

export function getCodeFact(code) {
  return FACTS[code?.toUpperCase()] || null
}

// Ordered list of candidate codenames — used by /checkin to pick the next unused
// codename when creating a walk-up attendee. ADMN is excluded (reserved for admin).
export const CODENAME_POOL = Object.keys(FACTS).filter(c => c !== 'ADMN')
