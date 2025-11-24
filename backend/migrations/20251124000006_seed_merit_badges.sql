-- Seed common outdoor and camping-related merit badges
-- This migration populates 30 merit badges commonly used on Scout outings

INSERT INTO merit_badges (name, description, keywords) VALUES
('Camping', 'Camping is one of the best-known methods of the Scouting movement. Learn about different types of camping, equipment, and outdoor skills.', 
 ARRAY['camping', 'outdoor', 'tent', 'backpacking', 'overnight', 'site', 'gear']),

('Hiking', 'Hiking teaches outdoor skills and develops fitness through trail experiences. Learn to plan and execute safe hikes.', 
 ARRAY['hiking', 'trail', 'backpacking', 'outdoor', 'navigation', 'map', 'compass']),

('Backpacking', 'Backpacking combines camping and hiking skills for multi-day wilderness trips. Learn about lightweight gear and backcountry techniques.', 
 ARRAY['backpacking', 'hiking', 'camping', 'wilderness', 'overnight', 'trail', 'gear']),

('Cooking', 'Learn to prepare nutritious meals using various cooking methods, including outdoor and camp cooking techniques.', 
 ARRAY['cooking', 'food', 'meal', 'preparation', 'camping', 'fire', 'stove']),

('First Aid', 'First aid is essential for responding to injuries and emergencies. Learn to provide immediate care until professional help arrives.', 
 ARRAY['first', 'aid', 'medical', 'emergency', 'safety', 'injury', 'cpr']),

('Emergency Preparedness', 'Learn how to prepare for and respond to various emergencies, both natural and man-made.', 
 ARRAY['emergency', 'preparedness', 'safety', 'disaster', 'first', 'aid', 'rescue']),

('Wilderness Survival', 'Learn essential survival skills for the wilderness, including shelter building, fire making, and finding water.', 
 ARRAY['survival', 'wilderness', 'shelter', 'fire', 'water', 'emergency', 'outdoor']),

('Pioneering', 'Learn to use rope, knots, and lashings to build camp structures and gadgets using traditional Scout pioneering skills.', 
 ARRAY['pioneering', 'lashing', 'rope', 'knot', 'camping', 'gadget', 'structure']),

('Orienteering', 'Master the use of map and compass to navigate through unfamiliar territory. Learn orienteering competition techniques.', 
 ARRAY['orienteering', 'navigation', 'map', 'compass', 'hiking', 'outdoor']),

('Weather', 'Learn to observe, predict, and understand weather patterns. Essential for safe outdoor activities.', 
 ARRAY['weather', 'forecast', 'outdoor', 'safety', 'camping', 'hiking']),

('Environmental Science', 'Study the environment and learn about conservation, pollution, and protecting natural resources.', 
 ARRAY['environment', 'conservation', 'nature', 'outdoor', 'ecology', 'wildlife']),

('Nature', 'Learn about plants, animals, and ecosystems in your local area. Develop observation skills and appreciation for nature.', 
 ARRAY['nature', 'plants', 'animals', 'wildlife', 'outdoor', 'ecology']),

('Forestry', 'Learn about forest management, tree identification, and the importance of forests to the environment.', 
 ARRAY['forestry', 'trees', 'forest', 'nature', 'conservation', 'outdoor']),

('Fishing', 'Learn fishing techniques, equipment, and conservation. Includes fly fishing and different fishing methods.', 
 ARRAY['fishing', 'water', 'outdoor', 'nature', 'camping']),

('Swimming', 'Learn essential swimming skills, water safety, and rescue techniques for aquatic activities.', 
 ARRAY['swimming', 'water', 'safety', 'aquatic', 'rescue']),

('Canoeing', 'Learn to paddle, maneuver, and safely operate a canoe. Includes flatwater and moving water techniques.', 
 ARRAY['canoeing', 'paddling', 'water', 'boat', 'outdoor', 'camping']),

('Kayaking', 'Learn kayaking skills including paddling techniques, safety, and maneuvering in various water conditions.', 
 ARRAY['kayaking', 'paddling', 'water', 'boat', 'outdoor']),

('Rowing', 'Learn rowing techniques, boat handling, and water safety in rowing craft.', 
 ARRAY['rowing', 'boat', 'water', 'outdoor']),

('Lifesaving', 'Learn water rescue techniques and how to save lives in aquatic emergencies.', 
 ARRAY['lifesaving', 'rescue', 'water', 'safety', 'swimming', 'emergency']),

('Climbing', 'Learn rock climbing techniques, safety procedures, and equipment use for climbing activities.', 
 ARRAY['climbing', 'rock', 'outdoor', 'safety', 'rope']),

('Cycling', 'Learn bicycle safety, maintenance, and touring techniques for cycling activities.', 
 ARRAY['cycling', 'bike', 'riding', 'outdoor', 'touring']),

('Snow Sports', 'Learn skiing, snowboarding, or snowshoeing techniques and winter outdoor safety.', 
 ARRAY['snow', 'skiing', 'winter', 'outdoor', 'cold', 'weather']),

('Geocaching', 'Learn to use GPS technology for treasure hunting and outdoor navigation activities.', 
 ARRAY['geocaching', 'gps', 'navigation', 'outdoor', 'hiking']),

('Astronomy', 'Learn about stars, planets, and celestial objects. Great for camping under the stars.', 
 ARRAY['astronomy', 'stars', 'sky', 'night', 'camping', 'outdoor']),

('Mammal Study', 'Learn to identify and observe mammals in their natural habitats.', 
 ARRAY['mammals', 'wildlife', 'nature', 'outdoor', 'animals']),

('Bird Study', 'Learn bird identification, observation techniques, and avian ecology.', 
 ARRAY['birds', 'wildlife', 'nature', 'outdoor', 'animals']),

('Insect Study', 'Study insects and their role in the ecosystem through collection and observation.', 
 ARRAY['insects', 'bugs', 'nature', 'outdoor', 'wildlife']),

('Reptile and Amphibian Study', 'Learn about reptiles and amphibians, their habitats, and conservation.', 
 ARRAY['reptiles', 'amphibians', 'wildlife', 'nature', 'outdoor', 'animals']),

('Plant Science', 'Study plant biology, identification, and the role of plants in ecosystems.', 
 ARRAY['plants', 'nature', 'outdoor', 'botany', 'ecology']),

('Soil and Water Conservation', 'Learn about soil erosion, water quality, and conservation practices.', 
 ARRAY['conservation', 'water', 'soil', 'environment', 'outdoor', 'ecology']);
