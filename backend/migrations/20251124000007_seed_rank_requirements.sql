-- Seed rank requirements (Scout, Tenderfoot, Second Class, First Class)
-- This migration populates common camping and outdoor-related rank requirements

-- Scout Rank Requirements
INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '3a', 'Repeat from memory the Outdoor Code. In your own words, explain what the Outdoor Code means to you.', 
 ARRAY['outdoor', 'code', 'leave', 'trace', 'conservation'], 'Outdoor Ethics'),

('Scout', '3b', 'Repeat from memory the Principles of Leave No Trace. In your own words, explain what the principles mean to you.', 
 ARRAY['lnt', 'leave', 'trace', 'outdoor', 'ethics', 'conservation', 'camping'], 'Outdoor Ethics');

-- Tenderfoot Requirements
INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '1a', 'Present yourself to your leader, properly dressed, before going on an overnight camping trip. Show the camping gear you will use. Show the right way to pack and carry it.', 
 ARRAY['camping', 'gear', 'packing', 'overnight'], 'Camping'),

('Tenderfoot', '1b', 'Spend at least one night on a patrol or troop campout. Sleep in a tent you have helped pitch.', 
 ARRAY['camping', 'overnight', 'tent', 'patrol'], 'Camping'),

('Tenderfoot', '1c', 'Tell how you practiced the Principles of Leave No Trace on a campout or outing.', 
 ARRAY['leave', 'trace', 'camping', 'outdoor', 'ethics'], 'Outdoor Ethics'),

('Tenderfoot', '2a', 'On the campout, assist in preparing one of the meals. Tell why it is important for each patrol member to share in meal preparation and cleanup.', 
 ARRAY['cooking', 'meal', 'camping', 'preparation', 'food'], 'Cooking'),

('Tenderfoot', '2b', 'While on a campout, demonstrate the appropriate method of safely cleaning items used to prepare, serve, and eat a meal.', 
 ARRAY['cooking', 'camping', 'cleaning', 'food', 'safety'], 'Cooking'),

('Tenderfoot', '2c', 'Explain the importance of eating together as a patrol.', 
 ARRAY['patrol', 'camping', 'meal', 'cooking'], 'Cooking'),

('Tenderfoot', '4a', 'Show first aid for the following: simple cuts and scrapes, blisters on the hand and foot, minor thermal/heat burns or scalds (first-degree), bites or stings of insects and ticks, poisonous plants, nosebleed, frostbite and sunburn.', 
 ARRAY['first', 'aid', 'safety', 'medical', 'injury', 'outdoor'], 'First Aid'),

('Tenderfoot', '5a', 'Demonstrate a practical use of the square knot.', 
 ARRAY['knot', 'rope', 'camping', 'lashing'], 'Camping Skills'),

('Tenderfoot', '5b', 'Demonstrate a practical use of two half-hitches.', 
 ARRAY['knot', 'rope', 'camping', 'lashing'], 'Camping Skills'),

('Tenderfoot', '5c', 'Demonstrate a practical use of the taut-line hitch.', 
 ARRAY['knot', 'rope', 'camping', 'lashing', 'tent'], 'Camping Skills');

-- Second Class Requirements
INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '1a', 'Since joining Scouts BSA, participate in five separate troop/patrol activities, at least three of which must be held outdoors. Of the outdoor activities, at least two must include overnight camping.', 
 ARRAY['camping', 'overnight', 'outdoor', 'patrol', 'activities'], 'Camping'),

('Second Class', '2a', 'Demonstrate how to find directions during the day and at night without using a compass or an electronic device.', 
 ARRAY['navigation', 'outdoor', 'hiking', 'compass', 'direction'], 'Navigation'),

('Second Class', '2b', 'Using a compass, complete an orienteering course that covers at least one mile and requires measuring the height and/or width of designated items.', 
 ARRAY['navigation', 'compass', 'orienteering', 'hiking', 'outdoor'], 'Navigation'),

('Second Class', '3a', 'Demonstrate how a compass works and how to orient a map. Use a map to point out and tell the meaning of five map symbols.', 
 ARRAY['navigation', 'compass', 'map', 'hiking', 'outdoor'], 'Navigation'),

('Second Class', '3b', 'Using a compass and map together, take a 5-mile hike (or 10 miles by bike) approved by your adult leader and your parent or guardian.', 
 ARRAY['hiking', 'navigation', 'compass', 'map', 'outdoor', 'backpacking'], 'Hiking'),

('Second Class', '3c', 'Describe some hazards or injuries that you might encounter on your hike and what you can do to help prevent them.', 
 ARRAY['hiking', 'safety', 'first', 'aid', 'outdoor'], 'First Aid'),

('Second Class', '3d', 'Demonstrate how to transport, store, and prepare foods on a campout.', 
 ARRAY['cooking', 'camping', 'food', 'preparation', 'storage'], 'Cooking'),

('Second Class', '5a', 'Explain when it is appropriate to use a fire for cooking or other purposes and when it would not be appropriate to do so.', 
 ARRAY['fire', 'cooking', 'camping', 'safety', 'leave', 'trace'], 'Camping Skills'),

('Second Class', '5b', 'Use the tools listed in Tenderfoot requirement 3d to prepare tinder, kindling, and fuel wood for a cooking fire.', 
 ARRAY['fire', 'camping', 'wood', 'cooking'], 'Camping Skills'),

('Second Class', '5c', 'Demonstrate how to build a fire; light the fire, unless prohibited by local fire restrictions. After allowing the flames to burn safely for at least two minutes, safely extinguish the flames with minimal impact to the fire site.', 
 ARRAY['fire', 'camping', 'safety', 'cooking'], 'Camping Skills'),

('Second Class', '6a', 'On one of these campouts, select a location for your patrol site and recommend it to your patrol leader, senior patrol leader, or troop guide. Explain what factors you should consider when choosing a patrol site and where to pitch a tent.', 
 ARRAY['camping', 'tent', 'site', 'patrol'], 'Camping'),

('Second Class', '6b', 'Demonstrate proper care, sharpening, and use of the knife, saw, and ax. Describe when each should be used.', 
 ARRAY['knife', 'saw', 'ax', 'camping', 'safety', 'tools'], 'Camping Skills');

-- First Class Requirements
INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '1a', 'Since joining Scouts BSA, participate in 10 separate troop/patrol activities, at least six of which must be held outdoors. Of the outdoor activities, at least three must include overnight camping.', 
 ARRAY['camping', 'overnight', 'outdoor', 'patrol', 'activities'], 'Camping'),

('First Class', '3a', 'Discuss when you should and should not use lashings.', 
 ARRAY['lashing', 'camping', 'pioneering', 'rope'], 'Camping Skills'),

('First Class', '3b', 'Demonstrate tying the timber hitch and clove hitch.', 
 ARRAY['knot', 'lashing', 'camping', 'rope'], 'Camping Skills'),

('First Class', '3c', 'Demonstrate tying the square, shear, and diagonal lashings by joining two or more poles or staves together.', 
 ARRAY['lashing', 'camping', 'pioneering', 'rope'], 'Camping Skills'),

('First Class', '3d', 'Use lashing to make a useful camp gadget or structure.', 
 ARRAY['lashing', 'camping', 'pioneering', 'gadget'], 'Camping Skills'),

('First Class', '4a', 'Using a map and compass, complete an orienteering course that covers at least one mile and requires measuring the height and/or width of designated items.', 
 ARRAY['navigation', 'compass', 'map', 'orienteering', 'hiking'], 'Navigation'),

('First Class', '4b', 'Demonstrate how to use a handheld GPS unit, GPS app on a smartphone, or other electronic navigation system. Use GPS to find your current location, a destination of your choice, and the route you will take to get there. Follow that route to arrive at your destination.', 
 ARRAY['navigation', 'gps', 'hiking', 'outdoor'], 'Navigation'),

('First Class', '5a', 'Identify or show evidence of at least 10 kinds of native plants found in your local area or campsite location.', 
 ARRAY['nature', 'plants', 'outdoor', 'camping', 'hiking'], 'Nature'),

('First Class', '5b', 'Identify two ways to obtain a weather forecast for an upcoming activity. Explain why weather forecasts are important when planning for an event.', 
 ARRAY['weather', 'outdoor', 'camping', 'hiking', 'safety'], 'Outdoor Skills'),

('First Class', '6a', 'Successfully complete your current requirements for Tenderfoot, Second Class, and First Class ranks. Obtain information from at least one BSA Scout appropriate resource and use information you have learned to plan and carry out at least three camping trips.', 
 ARRAY['camping', 'planning', 'outdoor'], 'Camping'),

('First Class', '7a', 'Discuss Leave No Trace with respect to camping. Explain how the Outdoor Code and Leave No Trace principles relate to your own camp cleanup.', 
 ARRAY['leave', 'trace', 'camping', 'outdoor', 'ethics', 'conservation'], 'Outdoor Ethics'),

('First Class', '7b', 'While on a campout, demonstrate appropriate methods for dealing with human and other waste, and explain to your patrol or troop what happens to waste when the campsite has no toilets.', 
 ARRAY['camping', 'sanitation', 'leave', 'trace', 'outdoor'], 'Camping'),

('First Class', '8a', 'After eating a meal, wash and store cooking gear in the proper manner.', 
 ARRAY['cooking', 'camping', 'cleaning', 'food'], 'Cooking'),

('First Class', '9a', 'Demonstrate bandages for a sprained ankle and for injuries on the head, the upper arm, and the collarbone.', 
 ARRAY['first', 'aid', 'medical', 'injury', 'safety'], 'First Aid'),

('First Class', '9b', 'Show how to transport a person from a smoke-filled room; transport for at least 25 yards a person with a sprained ankle.', 
 ARRAY['first', 'aid', 'safety', 'emergency', 'rescue'], 'First Aid'),

('First Class', '9c', 'Tell what you can do while on a campout or other outdoor activity to prevent or reduce the occurrence of injuries or exposure listed in Tenderfoot requirement 4a and Second Class requirement 5a.', 
 ARRAY['first', 'aid', 'safety', 'camping', 'outdoor', 'prevention'], 'First Aid');
