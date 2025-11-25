-- Seed all merit badges with keywords for suggestion matching
-- This migration populates all 141 merit badges (eagle_required added in later migration)

INSERT INTO merit_badges (name, description, keywords) VALUES
('American Business', NULL, ARRAY['american', 'business', 'economics', 'entrepreneurship', 'finance']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('American Cultures', NULL, ARRAY['american', 'communities', 'culture', 'cultures', 'diversity', 'heritage']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('American Heritage', NULL, ARRAY['american', 'heritage', 'history', 'patriotism', 'tradition']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('American Labor', NULL, ARRAY['american', 'economics', 'labor', 'unions', 'workplace']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Animal Science', NULL, ARRAY['animal', 'animals', 'husbandry', 'science', 'veterinary', 'zoology']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Animation', NULL, ARRAY['animation', 'art', 'digital', 'drawing']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Archaeology', NULL, ARRAY['archaeology', 'artifacts', 'digging', 'history']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Archery', NULL, ARRAY['archery', 'bow', 'shooting', 'target']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Architecture', NULL, ARRAY['architecture', 'blueprint', 'building', 'design']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Art', NULL, ARRAY['art', 'creative', 'drawing', 'painting']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Artificial Intelligence', NULL, ARRAY['ai', 'algorithms', 'artificial', 'data', 'intelligence', 'machine learning']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Astronomy', NULL, ARRAY['astronomy', 'space', 'stars', 'telescopes']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Athletics', NULL, ARRAY['athletics', 'competition', 'fitness', 'sports']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Automotive Maintenance', NULL, ARRAY['automotive', 'cars', 'maintenance', 'repair']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Aviation', NULL, ARRAY['aircraft', 'aviation', 'flight', 'pilot']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Backpacking', NULL, ARRAY['backpack', 'backpacking', 'camping', 'gear', 'hiking']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Basketry', NULL, ARRAY['basketry', 'crafts', 'materials', 'weaving']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Bird Study', NULL, ARRAY['bird', 'birds', 'habitat', 'identification', 'ornithology', 'study']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Bugling', NULL, ARRAY['bugl', 'bugling', 'ceremony', 'military', 'music']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Camping', NULL, ARRAY['camp', 'campcraft', 'camping', 'outdoors', 'tents']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Canoeing', NULL, ARRAY['canoe', 'canoeing', 'paddle', 'river', 'watercraft']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Chemistry', NULL, ARRAY['chemistry', 'elements', 'lab', 'reactions']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Chess', NULL, ARRAY['board', 'chess', 'strategy', 'tactics']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Citizenship in Society', NULL, ARRAY['citizenship', 'civic', 'rights', 'society']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Citizenship in the Community', NULL, ARRAY['citizenship', 'community', 'government', 'local', 'service']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Citizenship in the Nation', NULL, ARRAY['citizenship', 'civics', 'government', 'history', 'nation']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Citizenship in the World', NULL, ARRAY['citizenship', 'culture', 'diplomacy', 'global', 'international', 'world']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Climbing', NULL, ARRAY['belay', 'climb', 'climbing', 'rock', 'ropes']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Coin Collecting', NULL, ARRAY['coin', 'coins', 'collect', 'collecting', 'collection', 'history', 'numismatics']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Collections', NULL, ARRAY['catalog', 'collecting', 'collections', 'hobby', 'presentation']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Communication', NULL, ARRAY['communication', 'listening', 'public speaking', 'writing']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Composite Materials', NULL, ARRAY['composite', 'engineering', 'materials', 'structures']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Cooking', NULL, ARRAY['cook', 'cooking', 'cuisine', 'kitchen', 'nutrition']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Crime Prevention', NULL, ARRAY['crime', 'law', 'prevention', 'public safety']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Cybersecurity', NULL, ARRAY['cybersecurity', 'encryption', 'network', 'security']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Cycling', NULL, ARRAY['biking', 'cycl', 'cycling', 'fitness', 'road']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Dentistry', NULL, ARRAY['dentistry', 'health', 'oral', 'teeth']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Digital Technology', NULL, ARRAY['computers', 'digital', 'hardware', 'software', 'technology']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Disabilities Awareness', NULL, ARRAY['accessibility', 'advocacy', 'awareness', 'disabilities', 'disability', 'inclusion']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Dog Care', NULL, ARRAY['care', 'dog', 'dogs', 'health', 'training']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Drafting', NULL, ARRAY['blueprint', 'design', 'draft', 'drafting', 'technical']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Electricity', NULL, ARRAY['circuits', 'electricity', 'power', 'wiring']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Electronics', NULL, ARRAY['circuit', 'components', 'design', 'electronics']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Emergency Preparedness', NULL, ARRAY['emergency', 'planning', 'preparedness', 'safety']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Energy', NULL, ARRAY['efficiency', 'energy', 'power', 'renewable']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Engineering', NULL, ARRAY['design', 'engineer', 'engineering', 'problem-solving', 'structure']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Entrepreneurship', NULL, ARRAY['business', 'entrepreneurship', 'plan', 'startup']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Environmental Science', NULL, ARRAY['conservation', 'ecology', 'environment', 'environmental', 'science']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Exploration', NULL, ARRAY['adventure', 'discovery', 'exploration', 'travel']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Family Life', NULL, ARRAY['family', 'life', 'relationships', 'responsibility', 'values']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Farm Mechanics', NULL, ARRAY['agriculture', 'farm', 'machinery', 'mechanics']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Fingerprinting', NULL, ARRAY['crime', 'fingerprint', 'fingerprinting', 'forensics', 'identity']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Fire Safety', NULL, ARRAY['fire', 'prevention', 'protection', 'safety']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('First Aid', NULL, ARRAY['aid', 'emergency', 'first', 'first aid', 'health', 'medical']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Fish & Wildlife Management', NULL, ARRAY['conservation', 'fish', 'management', 'wildlife']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Fishing', NULL, ARRAY['angling', 'bait', 'fish', 'fishing', 'water']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Fly Fishing', NULL, ARRAY['catch', 'fish', 'fishing', 'flies', 'fly', 'fly fishing', 'stream']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Forestry', NULL, ARRAY['ecology', 'forest', 'forestry', 'management', 'trees']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Game Design', NULL, ARRAY['design', 'game', 'mechanics', 'video']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Gardening', NULL, ARRAY['garden', 'gardening', 'horticulture', 'plants', 'soil']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Genealogy', NULL, ARRAY['ancestry', 'family tree', 'genealogy', 'history']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Geocaching', NULL, ARRAY['geocach', 'geocaching', 'gps', 'outdoors', 'treasure']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Geology', NULL, ARRAY['earth', 'geology', 'minerals', 'rocks']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Golf', NULL, ARRAY['course', 'golf', 'rules', 'skills']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Graphic Arts', NULL, ARRAY['art', 'arts', 'design', 'graphic', 'visual']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Health Care Professions', NULL, ARRAY['care', 'health', 'medicine', 'professions']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Hiking', NULL, ARRAY['fitness', 'hik', 'hiking', 'navigation', 'trail']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Home Repairs', NULL, ARRAY['diy', 'home', 'home repair', 'maintenance', 'repairs', 'tools']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Horsemanship', NULL, ARRAY['care', 'horsemanship', 'horses', 'riding', 'stable']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Indian Lore', NULL, ARRAY['culture', 'history', 'indian', 'lore', 'native american', 'traditions']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Insect Study', NULL, ARRAY['entomology', 'identification', 'insect', 'insects', 'life cycle', 'study']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Inventing', NULL, ARRAY['creativity', 'innovation', 'invent', 'inventing', 'invention', 'patent']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Journalism', NULL, ARRAY['journalism', 'media', 'reporting', 'writing']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Kayaking', NULL, ARRAY['craft', 'kayak', 'kayaking', 'paddling', 'water']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Landscape Architecture', NULL, ARRAY['architecture', 'design', 'landscape', 'plants']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Law', NULL, ARRAY['justice', 'law', 'legal', 'rights']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Leatherwork', NULL, ARRAY['craft', 'leather', 'leatherwork', 'stitching', 'tooling']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Lifesaving', NULL, ARRAY['first aid', 'lifesav', 'lifesaving', 'rescue', 'water']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Mammal Study', NULL, ARRAY['biology', 'conservation', 'mammal', 'mammals', 'study']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Metalwork', NULL, ARRAY['fabrication', 'metal', 'metalwork', 'tools', 'welding']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Mining in Society', NULL, ARRAY['economics', 'geology', 'min', 'mining', 'resources', 'society']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Model Design and Building', NULL, ARRAY['build', 'building', 'craft', 'design', 'model']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Motorboating', NULL, ARRAY['boating', 'engine', 'motorboat', 'motorboating', 'navigation']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Moviemaking', NULL, ARRAY['editing', 'film', 'movie', 'moviemak', 'moviemaking', 'production']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Multisport', NULL, ARRAY['endurance', 'fitness', 'multisport', 'variety']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Music', NULL, ARRAY['instrument', 'music', 'sound', 'theory']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Nature', NULL, ARRAY['ecology', 'environment', 'nature', 'wildlife']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Nuclear Science', NULL, ARRAY['atoms', 'nuclear', 'physics', 'radiation', 'science']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Oceanography', NULL, ARRAY['marine', 'oceanography', 'science', 'sea']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Orienteering', NULL, ARRAY['compass', 'map', 'navigation', 'orienteer', 'orienteering']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Painting', NULL, ARRAY['art', 'brush', 'color', 'paint', 'painting']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Personal Fitness', NULL, ARRAY['exercise', 'fitness', 'health', 'personal', 'training']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Personal Management', NULL, ARRAY['budgeting', 'management', 'money', 'organization', 'personal']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Pets', NULL, ARRAY['animals', 'care', 'pets', 'responsibility']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Photography', NULL, ARRAY['camera', 'composition', 'images', 'photography']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Pioneering', NULL, ARRAY['knots', 'pioneer', 'pioneering', 'ropes', 'structures']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Plant Science', NULL, ARRAY['biology', 'botany', 'horticulture', 'plant', 'plants', 'science']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Plumbing', NULL, ARRAY['fixtures', 'pipes', 'plumb', 'plumbing', 'repair']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Pottery', NULL, ARRAY['ceramics', 'clay', 'craft', 'pottery']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Programming', NULL, ARRAY['coding', 'development', 'programm', 'programming', 'software']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Public Health', NULL, ARRAY['epidemiology', 'health', 'public', 'public health', 'society', 'wellness']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Public Speaking', NULL, ARRAY['communication', 'oratory', 'public', 'public speaking', 'speak', 'speaking', 'speech']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Pulp and Paper', NULL, ARRAY['manufacturing', 'paper', 'process', 'pulp']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Radio', NULL, ARRAY['communication', 'radio', 'transmit', 'waves']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Railroading', NULL, ARRAY['history', 'railroad', 'railroading', 'trains', 'transportation']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Reading', NULL, ARRAY['books', 'comprehension', 'literature', 'read', 'reading']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Reptile & Amphibian Study', NULL, ARRAY['amphibian', 'amphibians', 'biology', 'herpetology', 'reptile', 'reptiles', 'study']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Rifle Shooting', NULL, ARRAY['marksmanship', 'rifle', 'shoot', 'shooting', 'target']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Robotics', NULL, ARRAY['ai', 'automation', 'engineering', 'robotics']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Rowing', NULL, ARRAY['boat', 'row', 'rowing', 'teamwork', 'water']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Safety', NULL, ARRAY['hazards', 'precaution', 'risk', 'safety']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Salesmanship', NULL, ARRAY['business', 'communication', 'sales', 'salesmanship', 'selling']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Scholarship', NULL, ARRAY['academic', 'learning', 'scholarship', 'study']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Scouting Heritage', NULL, ARRAY['heritage', 'history', 'scout', 'scouting', 'scouts', 'tradition']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Scuba Diving', NULL, ARRAY['div', 'diving', 'marine', 'scuba', 'underwater']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Sculpture', NULL, ARRAY['3d', 'art', 'form', 'sculpture']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Search & Rescue', NULL, ARRAY['emergency', 'rescue', 'search', 'teamwork']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Shotgun Shooting', NULL, ARRAY['firearm', 'shoot', 'shooting', 'shotgun', 'target']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Signs, Signals & Codes', NULL, ARRAY['codes', 'communication', 'semaphore', 'signals', 'signs']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Skating', NULL, ARRAY['ice', 'roller', 'skat', 'skating', 'sport']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Small-Boat Sailing', NULL, ARRAY['boat', 'navigation', 'sail', 'sailing', 'small', 'water']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Snow Sports', NULL, ARRAY['lifetime', 'skiing', 'snow', 'snowboarding', 'sports']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Soil & Water Conservation', NULL, ARRAY['conservation', 'ecology', 'soil', 'water']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Space Exploration', NULL, ARRAY['astronomy', 'exploration', 'space', 'travel']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Sports', NULL, ARRAY['competition', 'fitness', 'games', 'sports']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Stamp Collecting', NULL, ARRAY['collect', 'collecting', 'history', 'philately', 'stamp']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Surveying', NULL, ARRAY['geometry', 'land', 'measure', 'survey', 'surveying']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Sustainability', NULL, ARRAY['eco', 'environment', 'green', 'sustainability']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Swimming', NULL, ARRAY['fitness', 'lifeguard', 'swimm', 'swimming', 'water']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Textile', NULL, ARRAY['design', 'fabric', 'sewing', 'textile']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Theater', NULL, ARRAY['acting', 'drama', 'performance', 'theater']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Traffic Safety', NULL, ARRAY['roads', 'safety', 'traffic', 'transportation']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Truck Transportation', NULL, ARRAY['driving', 'logistics', 'transportation', 'truck', 'trucks']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Veterinary Medicine', NULL, ARRAY['animals', 'health', 'medicine', 'veterinary']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Water Sports', NULL, ARRAY['activity', 'boating', 'sports', 'water']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Weather', NULL, ARRAY['climate', 'forecast', 'meteorology', 'weather']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Welding', NULL, ARRAY['fabrication', 'metal', 'torch', 'weld', 'welding']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Whitewater', NULL, ARRAY['rafting', 'rapids', 'river', 'whitewater']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Wilderness Survival', NULL, ARRAY['camping', 'skills', 'survival', 'wilderness']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Wood Carving', NULL, ARRAY['carv', 'carving', 'craft', 'sculpt', 'wood']);

INSERT INTO merit_badges (name, description, keywords) VALUES
('Woodwork', NULL, ARRAY['building', 'carpentry', 'craft', 'woodwork']);

