-- Seed all merit badges with keywords for suggestion matching
-- This migration populates all 141 merit badges including eagle-required flag

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('American Business', NULL, ARRAY['american', 'business', 'economics', 'entrepreneurship', 'finance'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('American Cultures', NULL, ARRAY['american', 'communities', 'culture', 'cultures', 'diversity', 'heritage'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('American Heritage', NULL, ARRAY['american', 'heritage', 'history', 'patriotism', 'tradition'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('American Labor', NULL, ARRAY['american', 'economics', 'labor', 'unions', 'workplace'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Animal Science', NULL, ARRAY['animal', 'animals', 'husbandry', 'science', 'veterinary', 'zoology'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Animation', NULL, ARRAY['animation', 'art', 'digital', 'drawing'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Archaeology', NULL, ARRAY['archaeology', 'artifacts', 'digging', 'history'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Archery', NULL, ARRAY['archery', 'bow', 'shooting', 'target'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Architecture', NULL, ARRAY['architecture', 'blueprint', 'building', 'design'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Art', NULL, ARRAY['art', 'creative', 'drawing', 'painting'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Artificial Intelligence', NULL, ARRAY['ai', 'algorithms', 'artificial', 'data', 'intelligence', 'machine learning'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Astronomy', NULL, ARRAY['astronomy', 'space', 'stars', 'telescopes'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Athletics', NULL, ARRAY['athletics', 'competition', 'fitness', 'sports'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Automotive Maintenance', NULL, ARRAY['automotive', 'cars', 'maintenance', 'repair'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Aviation', NULL, ARRAY['aircraft', 'aviation', 'flight', 'pilot'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Backpacking', NULL, ARRAY['backpack', 'backpacking', 'camping', 'gear', 'hiking'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Basketry', NULL, ARRAY['basketry', 'crafts', 'materials', 'weaving'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Bird Study', NULL, ARRAY['bird', 'birds', 'habitat', 'identification', 'ornithology', 'study'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Bugling', NULL, ARRAY['bugl', 'bugling', 'ceremony', 'military', 'music'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Camping', NULL, ARRAY['camp', 'campcraft', 'camping', 'outdoors', 'tents'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Canoeing', NULL, ARRAY['canoe', 'canoeing', 'paddle', 'river', 'watercraft'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Chemistry', NULL, ARRAY['chemistry', 'elements', 'lab', 'reactions'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Chess', NULL, ARRAY['board', 'chess', 'strategy', 'tactics'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Citizenship in Society', NULL, ARRAY['citizenship', 'civic', 'rights', 'society'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Citizenship in the Community', NULL, ARRAY['citizenship', 'community', 'government', 'local', 'service'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Citizenship in the Nation', NULL, ARRAY['citizenship', 'civics', 'government', 'history', 'nation'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Citizenship in the World', NULL, ARRAY['citizenship', 'culture', 'diplomacy', 'global', 'international', 'world'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Climbing', NULL, ARRAY['belay', 'climb', 'climbing', 'rock', 'ropes'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Coin Collecting', NULL, ARRAY['coin', 'coins', 'collect', 'collecting', 'collection', 'history', 'numismatics'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Collections', NULL, ARRAY['catalog', 'collecting', 'collections', 'hobby', 'presentation'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Communication', NULL, ARRAY['communication', 'listening', 'public speaking', 'writing'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Composite Materials', NULL, ARRAY['composite', 'engineering', 'materials', 'structures'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Cooking', NULL, ARRAY['cook', 'cooking', 'cuisine', 'kitchen', 'nutrition'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Crime Prevention', NULL, ARRAY['crime', 'law', 'prevention', 'public safety'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Cybersecurity', NULL, ARRAY['cybersecurity', 'encryption', 'network', 'security'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Cycling', NULL, ARRAY['biking', 'cycl', 'cycling', 'fitness', 'road'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Dentistry', NULL, ARRAY['dentistry', 'health', 'oral', 'teeth'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Digital Technology', NULL, ARRAY['computers', 'digital', 'hardware', 'software', 'technology'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Disabilities Awareness', NULL, ARRAY['accessibility', 'advocacy', 'awareness', 'disabilities', 'disability', 'inclusion'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Dog Care', NULL, ARRAY['care', 'dog', 'dogs', 'health', 'training'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Drafting', NULL, ARRAY['blueprint', 'design', 'draft', 'drafting', 'technical'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Electricity', NULL, ARRAY['circuits', 'electricity', 'power', 'wiring'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Electronics', NULL, ARRAY['circuit', 'components', 'design', 'electronics'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Emergency Preparedness', NULL, ARRAY['emergency', 'planning', 'preparedness', 'safety'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Energy', NULL, ARRAY['efficiency', 'energy', 'power', 'renewable'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Engineering', NULL, ARRAY['design', 'engineer', 'engineering', 'problem-solving', 'structure'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Entrepreneurship', NULL, ARRAY['business', 'entrepreneurship', 'plan', 'startup'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Environmental Science', NULL, ARRAY['conservation', 'ecology', 'environment', 'environmental', 'science'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Exploration', NULL, ARRAY['adventure', 'discovery', 'exploration', 'travel'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Family Life', NULL, ARRAY['family', 'life', 'relationships', 'responsibility', 'values'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Farm Mechanics', NULL, ARRAY['agriculture', 'farm', 'machinery', 'mechanics'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Fingerprinting', NULL, ARRAY['crime', 'fingerprint', 'fingerprinting', 'forensics', 'identity'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Fire Safety', NULL, ARRAY['fire', 'prevention', 'protection', 'safety'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('First Aid', NULL, ARRAY['aid', 'emergency', 'first', 'first aid', 'health', 'medical'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Fish & Wildlife Management', NULL, ARRAY['conservation', 'fish', 'management', 'wildlife'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Fishing', NULL, ARRAY['angling', 'bait', 'fish', 'fishing', 'water'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Fly Fishing', NULL, ARRAY['catch', 'fish', 'fishing', 'flies', 'fly', 'fly fishing', 'stream'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Forestry', NULL, ARRAY['ecology', 'forest', 'forestry', 'management', 'trees'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Game Design', NULL, ARRAY['design', 'game', 'mechanics', 'video'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Gardening', NULL, ARRAY['garden', 'gardening', 'horticulture', 'plants', 'soil'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Genealogy', NULL, ARRAY['ancestry', 'family tree', 'genealogy', 'history'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Geocaching', NULL, ARRAY['geocach', 'geocaching', 'gps', 'outdoors', 'treasure'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Geology', NULL, ARRAY['earth', 'geology', 'minerals', 'rocks'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Golf', NULL, ARRAY['course', 'golf', 'rules', 'skills'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Graphic Arts', NULL, ARRAY['art', 'arts', 'design', 'graphic', 'visual'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Health Care Professions', NULL, ARRAY['care', 'health', 'medicine', 'professions'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Hiking', NULL, ARRAY['fitness', 'hik', 'hiking', 'navigation', 'trail'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Home Repairs', NULL, ARRAY['diy', 'home', 'home repair', 'maintenance', 'repairs', 'tools'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Horsemanship', NULL, ARRAY['care', 'horsemanship', 'horses', 'riding', 'stable'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Indian Lore', NULL, ARRAY['culture', 'history', 'indian', 'lore', 'native american', 'traditions'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Insect Study', NULL, ARRAY['entomology', 'identification', 'insect', 'insects', 'life cycle', 'study'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Inventing', NULL, ARRAY['creativity', 'innovation', 'invent', 'inventing', 'invention', 'patent'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Journalism', NULL, ARRAY['journalism', 'media', 'reporting', 'writing'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Kayaking', NULL, ARRAY['craft', 'kayak', 'kayaking', 'paddling', 'water'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Landscape Architecture', NULL, ARRAY['architecture', 'design', 'landscape', 'plants'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Law', NULL, ARRAY['justice', 'law', 'legal', 'rights'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Leatherwork', NULL, ARRAY['craft', 'leather', 'leatherwork', 'stitching', 'tooling'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Lifesaving', NULL, ARRAY['first aid', 'lifesav', 'lifesaving', 'rescue', 'water'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Mammal Study', NULL, ARRAY['biology', 'conservation', 'mammal', 'mammals', 'study'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Metalwork', NULL, ARRAY['fabrication', 'metal', 'metalwork', 'tools', 'welding'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Mining in Society', NULL, ARRAY['economics', 'geology', 'min', 'mining', 'resources', 'society'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Model Design and Building', NULL, ARRAY['build', 'building', 'craft', 'design', 'model'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Motorboating', NULL, ARRAY['boating', 'engine', 'motorboat', 'motorboating', 'navigation'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Moviemaking', NULL, ARRAY['editing', 'film', 'movie', 'moviemak', 'moviemaking', 'production'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Multisport', NULL, ARRAY['endurance', 'fitness', 'multisport', 'variety'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Music', NULL, ARRAY['instrument', 'music', 'sound', 'theory'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Nature', NULL, ARRAY['ecology', 'environment', 'nature', 'wildlife'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Nuclear Science', NULL, ARRAY['atoms', 'nuclear', 'physics', 'radiation', 'science'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Oceanography', NULL, ARRAY['marine', 'oceanography', 'science', 'sea'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Orienteering', NULL, ARRAY['compass', 'map', 'navigation', 'orienteer', 'orienteering'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Painting', NULL, ARRAY['art', 'brush', 'color', 'paint', 'painting'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Personal Fitness', NULL, ARRAY['exercise', 'fitness', 'health', 'personal', 'training'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Personal Management', NULL, ARRAY['budgeting', 'management', 'money', 'organization', 'personal'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Pets', NULL, ARRAY['animals', 'care', 'pets', 'responsibility'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Photography', NULL, ARRAY['camera', 'composition', 'images', 'photography'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Pioneering', NULL, ARRAY['knots', 'pioneer', 'pioneering', 'ropes', 'structures'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Plant Science', NULL, ARRAY['biology', 'botany', 'horticulture', 'plant', 'plants', 'science'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Plumbing', NULL, ARRAY['fixtures', 'pipes', 'plumb', 'plumbing', 'repair'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Pottery', NULL, ARRAY['ceramics', 'clay', 'craft', 'pottery'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Programming', NULL, ARRAY['coding', 'development', 'programm', 'programming', 'software'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Public Health', NULL, ARRAY['epidemiology', 'health', 'public', 'public health', 'society', 'wellness'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Public Speaking', NULL, ARRAY['communication', 'oratory', 'public', 'public speaking', 'speak', 'speaking', 'speech'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Pulp and Paper', NULL, ARRAY['manufacturing', 'paper', 'process', 'pulp'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Radio', NULL, ARRAY['communication', 'radio', 'transmit', 'waves'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Railroading', NULL, ARRAY['history', 'railroad', 'railroading', 'trains', 'transportation'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Reading', NULL, ARRAY['books', 'comprehension', 'literature', 'read', 'reading'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Reptile & Amphibian Study', NULL, ARRAY['amphibian', 'amphibians', 'biology', 'herpetology', 'reptile', 'reptiles', 'study'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Rifle Shooting', NULL, ARRAY['marksmanship', 'rifle', 'shoot', 'shooting', 'target'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Robotics', NULL, ARRAY['ai', 'automation', 'engineering', 'robotics'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Rowing', NULL, ARRAY['boat', 'row', 'rowing', 'teamwork', 'water'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Safety', NULL, ARRAY['hazards', 'precaution', 'risk', 'safety'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Salesmanship', NULL, ARRAY['business', 'communication', 'sales', 'salesmanship', 'selling'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Scholarship', NULL, ARRAY['academic', 'learning', 'scholarship', 'study'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Scouting Heritage', NULL, ARRAY['heritage', 'history', 'scout', 'scouting', 'scouts', 'tradition'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Scuba Diving', NULL, ARRAY['div', 'diving', 'marine', 'scuba', 'underwater'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Sculpture', NULL, ARRAY['3d', 'art', 'form', 'sculpture'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Search & Rescue', NULL, ARRAY['emergency', 'rescue', 'search', 'teamwork'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Shotgun Shooting', NULL, ARRAY['firearm', 'shoot', 'shooting', 'shotgun', 'target'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Signs, Signals & Codes', NULL, ARRAY['codes', 'communication', 'semaphore', 'signals', 'signs'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Skating', NULL, ARRAY['ice', 'roller', 'skat', 'skating', 'sport'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Small-Boat Sailing', NULL, ARRAY['boat', 'navigation', 'sail', 'sailing', 'small', 'water'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Snow Sports', NULL, ARRAY['lifetime', 'skiing', 'snow', 'snowboarding', 'sports'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Soil & Water Conservation', NULL, ARRAY['conservation', 'ecology', 'soil', 'water'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Space Exploration', NULL, ARRAY['astronomy', 'exploration', 'space', 'travel'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Sports', NULL, ARRAY['competition', 'fitness', 'games', 'sports'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Stamp Collecting', NULL, ARRAY['collect', 'collecting', 'history', 'philately', 'stamp'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Surveying', NULL, ARRAY['geometry', 'land', 'measure', 'survey', 'surveying'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Sustainability', NULL, ARRAY['eco', 'environment', 'green', 'sustainability'], TRUE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Swimming', NULL, ARRAY['fitness', 'lifeguard', 'swimm', 'swimming', 'water'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Textile', NULL, ARRAY['design', 'fabric', 'sewing', 'textile'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Theater', NULL, ARRAY['acting', 'drama', 'performance', 'theater'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Traffic Safety', NULL, ARRAY['roads', 'safety', 'traffic', 'transportation'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Truck Transportation', NULL, ARRAY['driving', 'logistics', 'transportation', 'truck', 'trucks'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Veterinary Medicine', NULL, ARRAY['animals', 'health', 'medicine', 'veterinary'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Water Sports', NULL, ARRAY['activity', 'boating', 'sports', 'water'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Weather', NULL, ARRAY['climate', 'forecast', 'meteorology', 'weather'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Welding', NULL, ARRAY['fabrication', 'metal', 'torch', 'weld', 'welding'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Whitewater', NULL, ARRAY['rafting', 'rapids', 'river', 'whitewater'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Wilderness Survival', NULL, ARRAY['camping', 'skills', 'survival', 'wilderness'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Wood Carving', NULL, ARRAY['carv', 'carving', 'craft', 'sculpt', 'wood'], FALSE);

INSERT INTO merit_badges (name, description, keywords, eagle_required) VALUES
('Woodwork', NULL, ARRAY['building', 'carpentry', 'craft', 'woodwork'], FALSE);

