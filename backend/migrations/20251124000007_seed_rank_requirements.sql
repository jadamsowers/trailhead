-- Seed rank requirements from Scout through Eagle
-- This migration populates all 109 rank requirements with keywords for suggestion matching

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '10', 'Tell someone who is eligible to join Scouts BSA or an inactive Scout about your Scouting activities. Invite this person to an outing activity service project or meeting. Provide information on how to join or encourage the inactive Scout to become active. Share your efforts with your Scoutmaster or other adult leader.', ARRAY['active', 'adult', 'become', 'bsa', 'class', 'efforts', 'eligible', 'encourage', 'first', 'inactive', 'information', 'invite', 'join', 'leader', 'meet', 'meeting', 'out', 'outing', 'person', 'project', 'provide', 'recruit', 'recruiting', 'scout', 'scouting', 'scoutmaster', 'scouts', 'service', 'share', 'someone', 'tell', 'who', 'your'], 'Recruiting');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '1a', 'Since joining Scouts BSA participate in 10 separate troop/patrol activities at least six of which must be held outdoors. Of the outdoor activities at least three must include overnight camping. These activities do not include troop or patrol meetings. On campouts spend the night in a tent that you pitch or other structure that you help erect such as a lean-to snow cave or tepee.', ARRAY['bsa', 'camp', 'camping', 'campouts', 'cave', 'class', 'erect', 'first', 'held', 'help', 'include', 'join', 'joining', 'lean', 'least', 'meetings', 'must', 'night', 'outdoor', 'outdoors', 'overnight', 'participate', 'patrol', 'pitch', 'scouts', 'separate', 'since', 'six', 'snow', 'spend', 'structure', 'tent', 'tepee', 'three', 'troop', 'which', 'you'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '1b', 'Explain the potential impacts of camping both on the environment and on other outdoor users. Explain why the Outdoor Code and Leave No Trace Seven Principles are important for protecting the outdoors.', ARRAY['camp', 'camping', 'class', 'code', 'environment', 'ethics', 'explain', 'first', 'impacts', 'important', 'leave', 'outdoor', 'outdoor ethics', 'outdoors', 'potential', 'principles', 'protect', 'protecting', 'seven', 'trace', 'users'], 'Outdoor Ethics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '2a', 'Help plan a menu for one of the above campouts that includes at least one breakfast one lunch and one dinner and that requires cooking at least two of the meals. Tell how the menu includes the foods from MyPlate or the current USDA nutritional model and how it meets nutritional needs for the planned activity or campout.', ARRAY['breakfast', 'campout', 'campouts', 'class', 'cook', 'cooking', 'current', 'dinner', 'first', 'foods', 'help', 'includes', 'least', 'lunch', 'meal planning', 'meals', 'meets', 'menu', 'model', 'myplate', 'needs', 'nutritional', 'one', 'plan', 'planned', 'requires', 'tell', 'two', 'usda'], 'Cooking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '2b', 'Using the menu planned in First Class requirement 2a make a list showing a budget and the food amounts needed to feed three or more youth. Secure the ingredients.', ARRAY['amounts', 'budget', 'class', 'cook', 'cooking', 'feed', 'first', 'food', 'ingredients', 'list', 'make', 'meal planning', 'menu', 'needed', 'planned', 'requirement', 'secure', 'show', 'showing', 'three', 'using', 'youth'], 'Cooking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '2c', 'Show which pans utensils and other gear will be needed to cook and serve these meals.', ARRAY['class', 'cook', 'cooking', 'cooking equipment', 'first', 'gear', 'meals', 'needed', 'pans', 'serve', 'show', 'utensils', 'which'], 'Cooking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '2d', 'Demonstrate the procedures to follow in the safe handling and storage of fresh meats dairy products eggs vegetables and other perishable food products. Show how to properly dispose of camp garbage cans plastic containers waste water and other rubbish.', ARRAY['camp', 'cans', 'class', 'containers', 'cook', 'cooking', 'dairy', 'demonstrate', 'dispose', 'eggs', 'first', 'follow', 'food', 'food safety', 'fresh', 'garbage', 'handl', 'handling', 'meats', 'perishable', 'plastic', 'procedures', 'products', 'properly', 'rubbish', 'safe', 'show', 'storage', 'vegetables', 'waste', 'water'], 'Cooking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '2e', 'On one campout serve as cook. Supervise your assistant(s) in using a stove or building a cooking fire. Prepare the breakfast lunch and dinner planned in First Class requirement 2a. Supervise the cleanup.', ARRAY['assistant', 'breakfast', 'build', 'building', 'campout', 'class', 'cleanup', 'cook', 'cooking', 'dinner', 'fire', 'first', 'lunch', 'one', 'planned', 'prepare', 'requirement', 'serve', 'stove', 'supervise', 'using', 'your'], 'Cooking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '3a', 'Discuss when you should and should not use lashings.', ARRAY['class', 'discuss', 'first', 'lashings', 'pioneer', 'pioneering', 'use', 'you'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '3b', 'Demonstrate tying the timber hitch and clove hitch.', ARRAY['class', 'clove', 'demonstrate', 'first', 'hitch', 'pioneer', 'pioneering', 'timber', 'timber hitch', 'tying'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '3c', 'Demonstrate tying the square shear and diagonal lashings by joining two or more poles or staves together.', ARRAY['class', 'demonstrate', 'diagonal', 'first', 'join', 'joining', 'lashings', 'pioneer', 'pioneering', 'poles', 'shear', 'square', 'staves', 'together', 'two', 'tying'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '3d', 'Use lashings to make a useful camp gadget or structure.', ARRAY['camp', 'class', 'first', 'gadget', 'lashings', 'make', 'pioneer', 'pioneering', 'structure', 'use', 'useful'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '4a', 'Using a map and compass complete an orienteering course that covers at least one mile and requires measuring the height and/or width of designated items (tree tower canyon ditch etc.).', ARRAY['canyon', 'class', 'compass', 'complete', 'course', 'covers', 'designated', 'ditch', 'etc', 'first', 'height', 'items', 'least', 'map', 'measur', 'measuring', 'mile', 'navigation', 'one', 'orienteer', 'orienteering', 'requires', 'tower', 'tree', 'using', 'width'], 'Navigation');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '4b', 'Demonstrate how to use a handheld GPS unit GPS app on a smartphone or other electronic navigation system while on a campout or hike. Use GPS to find your current location a destination of your choice and the route you will take to get there. Follow that route to arrive at your destination.', ARRAY['app', 'arrive', 'campout', 'choice', 'class', 'current', 'demonstrate', 'destination', 'electronic', 'find', 'first', 'follow', 'get', 'gps', 'handheld', 'hike', 'location', 'navigation', 'route', 'smartphone', 'system', 'take', 'unit', 'use', 'while', 'you', 'your'], 'Navigation');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '5a', 'Identify or show evidence of at least 10 kinds of native plants found in your local area or campsite location. You may show evidence by identifying fallen leaves or fallen fruit that you find in the field or as part of a collection you have made or by photographs you have taken.', ARRAY['area', 'campsite', 'class', 'collection', 'evidence', 'fallen', 'field', 'find', 'first', 'found', 'fruit', 'identify', 'identifying', 'kinds', 'least', 'leaves', 'local', 'location', 'made', 'may', 'native', 'nature', 'part', 'photographs', 'plant identification', 'plants', 'show', 'taken', 'you', 'your'], 'Nature');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '5b', 'Identify two ways to obtain a weather forecast for an upcoming activity. Explain why weather forecasts are important when planning for an event.', ARRAY['class', 'event', 'explain', 'first', 'forecast', 'forecasts', 'identify', 'important', 'obtain', 'plann', 'planning', 'two', 'upcom', 'upcoming', 'ways', 'weather', 'weather forecasting'], 'Weather');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '5c', 'Describe at least three natural indicators of impending hazardous weather the potential dangerous events that might result from such weather conditions and the appropriate actions to take.', ARRAY['actions', 'appropriate', 'class', 'conditions', 'dangerous', 'describe', 'events', 'first', 'hazardous', 'impend', 'impending', 'indicators', 'least', 'might', 'natural', 'potential', 'result', 'take', 'three', 'weather', 'weather signs'], 'Weather');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '5d', 'Describe extreme weather conditions you might encounter in the outdoors in your local geographic area. Discuss how you would determine ahead of time the potential risk of these types of weather dangers alternative planning considerations to avoid such risks and how you would prepare for and respond to those weather conditions.', ARRAY['ahead', 'alternative', 'area', 'avoid', 'class', 'conditions', 'considerations', 'dangers', 'describe', 'determine', 'discuss', 'encounter', 'extreme', 'extreme weather', 'first', 'geographic', 'local', 'might', 'outdoors', 'plann', 'planning', 'potential', 'prepare', 'respond', 'risk', 'risks', 'time', 'types', 'weather', 'would', 'you', 'your'], 'Weather');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '6a', 'Successfully complete the BSA swimmer test.', ARRAY['aquatics', 'bsa', 'class', 'complete', 'first', 'successfully', 'swimmer', 'swimming', 'test'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '6b', 'Tell what precautions must be taken for a safe trip afloat.', ARRAY['afloat', 'aquatics', 'boating safety', 'class', 'first', 'must', 'precautions', 'safe', 'taken', 'tell', 'trip', 'what'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '6c', 'Identify the basic parts of a canoe kayak or other boat. Identify the parts of a paddle or an oar.', ARRAY['aquatics', 'basic', 'boat', 'canoe', 'class', 'first', 'identify', 'kayak', 'oar', 'paddle', 'parts', 'watercraft'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '6d', 'Describe proper body positioning in a watercraft depending on the type and size of the vessel. Explain the importance of proper body position in the boat.', ARRAY['aquatics', 'boat', 'body', 'class', 'depend', 'depending', 'describe', 'explain', 'first', 'importance', 'position', 'positioning', 'proper', 'size', 'type', 'vessel', 'watercraft'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '6e', 'With a helper and a practice victim show a line rescue both as tender and as rescuer. (The practice victim should be approximately 30 feet from shore in deep water.)', ARRAY['approximately', 'aquatics', 'class', 'deep', 'feet', 'first', 'helper', 'line', 'practice', 'rescue', 'rescuer', 'shore', 'show', 'tender', 'victim', 'water', 'water rescue'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '7a', 'Demonstrate bandages for a sprained ankle and for injuries on the head the upper arm and the collarbone.', ARRAY['aid', 'ankle', 'arm', 'bandages', 'class', 'collarbone', 'demonstrate', 'first', 'first aid', 'head', 'injuries', 'sprained', 'upper'], 'First Aid');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '7b', 'By yourself and with a partner show how to: transport a person from a smoke-filled room; transport for at least 25 yards a person with a sprained ankle.', ARRAY['aid', 'ankle', 'class', 'filled', 'first', 'first aid', 'least', 'partner', 'person', 'room', 'show', 'smoke', 'sprained', 'transport', 'yards', 'yourself'], 'First Aid');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '7c', 'Tell the five most common signals of a heart attack. Explain the steps (procedures) in cardiopulmonary resuscitation (CPR).', ARRAY['aid', 'attack', 'cardiopulmonary', 'class', 'common', 'cpr', 'explain', 'first', 'first aid', 'five', 'heart', 'procedures', 'resuscitation', 'signals', 'steps', 'tell'], 'First Aid');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '7d', 'Tell what utility services exist in your home or meeting place. Describe potential hazards associated with these utilities and tell how to respond in emergency situations.', ARRAY['associated', 'class', 'describe', 'emergency', 'exist', 'first', 'hazards', 'home', 'meet', 'meeting', 'place', 'potential', 'respond', 'safety', 'services', 'situations', 'tell', 'utilities', 'utility', 'what', 'your'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '7e', 'Develop an emergency action plan for your home that includes what to do in case of fire storm power outage and water outage.', ARRAY['action', 'case', 'class', 'develop', 'emergency', 'emergency plan', 'fire', 'first', 'home', 'includes', 'outage', 'plan', 'power', 'safety', 'storm', 'water', 'what', 'your'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '7f', 'Explain how to obtain potable water in an emergency.', ARRAY['class', 'emergency', 'explain', 'first', 'obtain', 'potable', 'safety', 'water', 'water purification'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '8a', 'After completing Second Class requirement 7a be physically active at least 30 minutes each day for five days a week for four weeks. Keep track of your activities.', ARRAY['active', 'class', 'complet', 'completing', 'day', 'days', 'first', 'fitness', 'five', 'four', 'keep', 'least', 'minutes', 'physically', 'requirement', 'second', 'track', 'week', 'weeks', 'your'], 'Fitness');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '8b', 'Share your challenges and successes in completing First Class requirement 8a. Set a goal for continuing to include physical activity as part of your daily life.', ARRAY['challenges', 'class', 'complet', 'completing', 'continu', 'continuing', 'daily', 'first', 'fitness', 'fitness goals', 'goal', 'include', 'life', 'part', 'physical', 'requirement', 'set', 'share', 'successes', 'your'], 'Fitness');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '9a', 'Visit and discuss with a selected individual approved by your leader (for example an elected official judge attorney civil servant principal or teacher) the constitutional rights and obligations of a U.S. citizen.', ARRAY['approved', 'attorney', 'citizen', 'citizenship', 'civil', 'class', 'constitutional', 'discuss', 'elected', 'example', 'first', 'individual', 'judge', 'leader', 'obligations', 'official', 'principal', 'rights', 'selected', 'servant', 'teacher', 'visit', 'your'], 'Citizenship');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '9b', 'Investigate an environmental issue affecting your community. Share what you learned about that issue with your patrol or troop. Tell what if anything could be done by you or your community to address the concern.', ARRAY['address', 'affect', 'affecting', 'anyth', 'anything', 'citizenship', 'class', 'community', 'concern', 'could', 'done', 'environmental', 'environmental issue', 'first', 'investigate', 'issue', 'learned', 'patrol', 'share', 'tell', 'troop', 'what', 'you', 'your'], 'Citizenship');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '9c', 'On a Scouting or family outing take note of the trash and garbage you produce. Before your next similar outing decide how you can reduce recycle or repurpose what you take on that outing and then put those plans into action. Compare your results.', ARRAY['action', 'class', 'compare', 'conservation', 'decide', 'family', 'first', 'garbage', 'next', 'note', 'out', 'outing', 'plans', 'produce', 'put', 'recycle', 'reduce', 'repurpose', 'results', 'scout', 'scouting', 'similar', 'take', 'trash', 'what', 'you', 'your'], 'Conservation');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('First Class', '9d', 'Participate in three hours of service through one or more service projects approved by your Scoutmaster. The project(s) must not be the same service project(s) used for Tenderfoot requirement 7b and Second Class requirement 8e. Explain how your service to others relates to the Scout Law.', ARRAY['approved', 'class', 'explain', 'first', 'hours', 'law', 'must', 'one', 'others', 'participate', 'project', 'projects', 'relates', 'requirement', 'scout', 'scoutmaster', 'second', 'service', 'tenderfoot', 'three', 'used', 'your'], 'Service');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '1a', 'Repeat from memory the Scout Oath Scout Law Scout motto and Scout slogan. In your own words explain their meaning.', ARRAY['explain', 'knowledge', 'law', 'mean', 'meaning', 'memory', 'motto', 'oath', 'repeat', 'scout', 'scout oath', 'slogan', 'their', 'words', 'your'], 'Scout Knowledge');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '1b', 'Explain what Scout spirit is. Describe some ways you have shown Scout spirit by practicing the Scout Oath Scout Law Scout motto and Scout slogan.', ARRAY['describe', 'explain', 'law', 'motto', 'oath', 'practic', 'practicing', 'scout', 'scout spirit', 'shown', 'slogan', 'spirit', 'ways', 'what', 'you'], 'Scout Spirit');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '1c', 'Demonstrate the Scout sign salute and handshake. Explain when they should be used.', ARRAY['demonstrate', 'explain', 'handshake', 'knowledge', 'salute', 'scout', 'scout sign', 'sign', 'they', 'used'], 'Scout Knowledge');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '1d', 'Describe the First Class Scout badge and tell what each part stands for. Explain the significance of the First Class Scout badge.', ARRAY['badge', 'class', 'describe', 'explain', 'first', 'knowledge', 'part', 'scout', 'significance', 'stands', 'tell', 'what'], 'Scout Knowledge');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '1e', 'Repeat from memory the Outdoor Code. List the Leave No Trace Seven Principles. Explain the difference between the two.', ARRAY['code', 'difference', 'ethics', 'explain', 'leave', 'list', 'memory', 'outdoor', 'outdoor code', 'principles', 'repeat', 'scout', 'seven', 'trace', 'two'], 'Outdoor Ethics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '1f', 'Repeat from memory the Pledge of Allegiance. In your own words explain its meaning.', ARRAY['allegiance', 'citizenship', 'explain', 'its', 'mean', 'meaning', 'memory', 'pledge', 'pledge of allegiance', 'repeat', 'scout', 'words', 'your'], 'Citizenship');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '2a', 'Describe how the Scouts in the troop provide its leadership.', ARRAY['describe', 'its', 'leadership', 'provide', 'scout', 'scouts', 'troop'], 'Troop Leadership');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '2b', 'Describe the four steps of Scout advancement.', ARRAY['advancement', 'describe', 'four', 'scout', 'steps'], 'Advancement');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '2c', 'Describe what the Scouts BSA ranks are and how they are earned.', ARRAY['advancement', 'bsa', 'describe', 'earned', 'ranks', 'scout', 'scouts', 'they', 'what'], 'Advancement');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '2d', 'Describe what merit badges are and how they are earned.', ARRAY['advancement', 'badges', 'describe', 'earned', 'merit badges', 'scout', 'they', 'what'], 'Advancement');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '3a', 'Explain the patrol method. Describe the types of patrols that are used in your troop.', ARRAY['describe', 'explain', 'method', 'patrol', 'patrol method', 'patrols', 'scout', 'troop', 'types', 'used', 'your'], 'Patrol Method');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '3b', 'Become familiar with your patrol name emblem flag and yell. Explain how these items create patrol spirit.', ARRAY['become', 'create', 'emblem', 'explain', 'familiar', 'flag', 'items', 'name', 'patrol', 'scout', 'spirit', 'yell', 'your'], 'Patrol Spirit');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '4a', 'Show how to tie a square knot two half-hitches and a taut-line hitch. Explain how each knot is used.', ARRAY['explain', 'half', 'hitch', 'hitches', 'knot', 'knots', 'line', 'pioneer', 'pioneering', 'scout', 'show', 'square', 'taut', 'tie', 'two', 'used'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '4b', 'Show the proper care of a rope by learning how to whip and fuse the ends of different kinds of rope.', ARRAY['care', 'different', 'ends', 'fuse', 'kinds', 'pioneer', 'pioneering', 'proper', 'rope', 'rope care', 'scout', 'show', 'whip'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '5', 'Tell what you need to know about pocketknife safety and responsibility.', ARRAY['know', 'need', 'pocketknife', 'responsibility', 'safety', 'scout', 'tell', 'tools', 'what', 'you'], 'Tools');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Scout', '6', 'With your parent or guardian complete the exercises in the pamphlet How to Protect Your Children From Child Abuse: A Parent''s Guide and view the Personal Safety Awareness videos.', ARRAY['abuse', 'awareness', 'child', 'children', 'complete', 'exercises', 'guardian', 'guide', 'pamphlet', 'parent', 'parent''s', 'personal', 'personal safety', 'protect', 'safety', 'scout', 'videos', 'view', 'your'], 'Personal Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '1a', 'Since joining Scouts BSA participate in five separate troop/patrol activities at least three of which must be held outdoors. Of the outdoor activities at least two must include overnight camping. These activities do not include troop or patrol meetings. On campouts spend the night in a tent that you pitch or other structure that you help erect such as a lean-to snow cave or tepee.', ARRAY['bsa', 'camp', 'camping', 'campouts', 'cave', 'class', 'erect', 'five', 'held', 'help', 'include', 'join', 'joining', 'lean', 'least', 'meetings', 'must', 'night', 'outdoor', 'outdoors', 'overnight', 'participate', 'patrol', 'pitch', 'scouts', 'second', 'separate', 'since', 'snow', 'spend', 'structure', 'tent', 'tepee', 'three', 'troop', 'two', 'which', 'you'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '1b', 'Recite the Leave No Trace Seven Principles from memory. Explain how you follow them on all outings.', ARRAY['class', 'ethics', 'explain', 'follow', 'leave', 'leave no trace', 'memory', 'outdoor', 'outings', 'principles', 'recite', 'second', 'seven', 'them', 'trace', 'you'], 'Outdoor Ethics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '1c', 'On one of these campouts select a location for your patrol site and recommend it to your patrol leader senior patrol leader or troop guide. Explain what factors you should consider when choosing a patrol site and where to pitch a tent.', ARRAY['camp', 'camping', 'campouts', 'campsite selection', 'choos', 'choosing', 'class', 'consider', 'explain', 'factors', 'guide', 'leader', 'location', 'one', 'patrol', 'pitch', 'recommend', 'second', 'select', 'senior', 'site', 'tent', 'troop', 'what', 'you', 'your'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '2a', 'Explain when it is appropriate to use a fire for cooking or other purposes and when it would not be appropriate to do so.', ARRAY['appropriate', 'camp', 'camping', 'class', 'cook', 'cooking', 'explain', 'fire', 'fire safety', 'purposes', 'second', 'use', 'would'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '2b', 'Use a pocketknife and a saw or axe if needed to prepare tinder kindling and fuel wood for a cooking fire.', ARRAY['axe', 'camp', 'camping', 'class', 'cook', 'cooking', 'fire', 'fire building', 'fuel', 'kindl', 'kindling', 'needed', 'pocketknife', 'prepare', 'saw', 'second', 'tinder', 'use', 'wood'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '2c', 'Using a minimum-impact method and at an approved outdoor location and time use the tinder kindling and fuel wood from Second Class requirement 2b to demonstrate how to build a fire. Unless prohibited by local fire restrictions light the fire. After allowing the flames to burn safely for at least two minutes safely extinguish the flames with minimal impact to the fire site. Properly dispose of the ashes and any charred remains.', ARRAY['allow', 'allowing', 'any', 'approved', 'ashes', 'build', 'burn', 'camp', 'camping', 'charred', 'class', 'demonstrate', 'dispose', 'extinguish', 'fire', 'fire building', 'flames', 'fuel', 'impact', 'kindl', 'kindling', 'least', 'light', 'local', 'location', 'method', 'minimal', 'minimum', 'minutes', 'outdoor', 'prohibited', 'properly', 'remains', 'requirement', 'restrictions', 'safely', 'second', 'site', 'time', 'tinder', 'two', 'unless', 'use', 'using', 'wood'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '2d', 'Explain when it is appropriate to use a lightweight stove and when it is appropriate to use a propane stove. Set up a lightweight stove or propane stove. Light the stove unless prohibited by local fire restrictions. Describe the safety procedures for using these types of stoves.', ARRAY['appropriate', 'camp', 'camp stoves', 'camping', 'class', 'describe', 'explain', 'fire', 'light', 'lightweight', 'local', 'procedures', 'prohibited', 'propane', 'restrictions', 'safety', 'second', 'set', 'stove', 'stoves', 'types', 'unless', 'use', 'using'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '2e', 'On one campout plan and cook one hot breakfast or lunch selecting foods from MyPlate or the current USDA nutritional model. Explain the importance of good nutrition. Demonstrate how to transport store and prepare the foods you selected.', ARRAY['breakfast', 'campout', 'class', 'cook', 'cooking', 'current', 'demonstrate', 'explain', 'foods', 'good', 'hot', 'importance', 'lunch', 'model', 'myplate', 'nutrition', 'nutritional', 'one', 'plan', 'prepare', 'second', 'select', 'selected', 'selecting', 'store', 'transport', 'usda', 'you'], 'Cooking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '2f', 'Demonstrate tying the sheet bend knot. Describe a situation in which you would use this knot.', ARRAY['bend', 'class', 'demonstrate', 'describe', 'knot', 'pioneer', 'pioneering', 'second', 'sheet', 'sheet bend', 'situation', 'tying', 'use', 'which', 'would', 'you'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '2g', 'Demonstrate tying the bowline knot. Describe a situation in which you would use this knot.', ARRAY['bowline', 'class', 'demonstrate', 'describe', 'knot', 'pioneer', 'pioneering', 'second', 'situation', 'tying', 'use', 'which', 'would', 'you'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '3a', 'Demonstrate how a compass works and how to orient a map. Use a map to point out and tell the meaning of five map symbols.', ARRAY['class', 'compass', 'demonstrate', 'five', 'map', 'mean', 'meaning', 'navigation', 'orient', 'out', 'point', 'second', 'symbols', 'tell', 'use', 'works'], 'Navigation');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '3b', 'Using a compass and map together take a 5-mile hike (or 10 miles by bike) approved by your adult leader and your parent or guardian.', ARRAY['adult', 'approved', 'bike', 'class', 'compass', 'guardian', 'hik', 'hike', 'hiking', 'leader', 'map', 'mile', 'miles', 'parent', 'second', 'take', 'together', 'using', 'your'], 'Hiking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '3c', 'Describe some hazards or injuries that you might encounter on your hike and what you can do to help prevent them.', ARRAY['class', 'describe', 'encounter', 'hazards', 'help', 'hike', 'hiking safety', 'injuries', 'might', 'prevent', 'safety', 'second', 'them', 'what', 'you', 'your'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '3d', 'Demonstrate how to find directions during the day and at night without using a compass or an electronic device.', ARRAY['class', 'compass', 'day', 'demonstrate', 'device', 'directions', 'electronic', 'find', 'navigation', 'night', 'second', 'using', 'without'], 'Navigation');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '4', 'Identify or show evidence of at least 10 kinds of wild animals (such as birds mammals reptiles fish or mollusks) found in your local area or camping location. You may show evidence by tracks signs or photographs you have taken.', ARRAY['animals', 'area', 'birds', 'camp', 'camping', 'class', 'evidence', 'fish', 'found', 'identify', 'kinds', 'least', 'local', 'location', 'mammals', 'may', 'mollusks', 'nature', 'photographs', 'reptiles', 'second', 'show', 'signs', 'taken', 'tracks', 'wild', 'wildlife', 'you', 'your'], 'Nature');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '5a', 'Tell what precautions must be taken for a safe swim.', ARRAY['aquatics', 'class', 'must', 'precautions', 'safe', 'second', 'swim', 'swimming safety', 'taken', 'tell', 'what'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '5b', 'Demonstrate your ability to pass the BSA beginner test: Jump feetfirst into water over your head in depth level off and swim 25 feet on the surface stop turn sharply resume swimming then return to your starting place.', ARRAY['ability', 'aquatics', 'beginner', 'bsa', 'class', 'demonstrate', 'depth', 'feet', 'feetfirst', 'head', 'jump', 'level', 'off', 'over', 'pass', 'place', 'resume', 'return', 'second', 'sharply', 'start', 'starting', 'stop', 'surface', 'swim', 'swimm', 'swimming', 'test', 'turn', 'water', 'your'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '5c', 'Demonstrate water rescue methods by reaching with your arm or leg by reaching with a suitable object and by throwing lines and objects.', ARRAY['aquatics', 'arm', 'class', 'demonstrate', 'leg', 'lines', 'methods', 'object', 'objects', 'reach', 'reaching', 'rescue', 'second', 'suitable', 'throw', 'throwing', 'water', 'water rescue', 'your'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '5d', 'Explain why swimming rescues should not be attempted when a reaching or throwing rescue is possible. Explain why and how a rescue swimmer should avoid contact with the victim.', ARRAY['aquatics', 'attempted', 'avoid', 'class', 'contact', 'explain', 'possible', 'reach', 'reaching', 'rescue', 'rescues', 'second', 'swimm', 'swimmer', 'swimming', 'throw', 'throwing', 'victim', 'water rescue'], 'Aquatics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '6a', 'Demonstrate first aid for object in the eye; bite of a warm-blooded animal; puncture wounds from a splinter nail and fishhook; serious burns (partial thickness or second-degree); heat exhaustion; shock; heatstroke dehydration hypothermia and hyperventilation.', ARRAY['aid', 'animal', 'bite', 'blooded', 'burns', 'class', 'degree', 'dehydration', 'demonstrate', 'exhaustion', 'eye', 'first', 'first aid', 'fishhook', 'heat', 'heatstroke', 'hyperventilation', 'hypothermia', 'nail', 'object', 'partial', 'puncture', 'second', 'serious', 'shock', 'splinter', 'thickness', 'warm', 'wounds'], 'First Aid');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '6b', 'Show what to do for hurry cases of stopped breathing stroke severe bleeding and ingested poisoning.', ARRAY['aid', 'bleed', 'bleeding', 'breath', 'breathing', 'cases', 'class', 'first', 'first aid', 'hurry', 'ingested', 'poison', 'poisoning', 'second', 'severe', 'show', 'stopped', 'stroke', 'what'], 'First Aid');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '6c', 'Tell what you can do while on a campout or hike to prevent or reduce the occurrence of the injuries listed in Second Class requirements 6a and 6b.', ARRAY['campout', 'class', 'hike', 'injuries', 'injury prevention', 'listed', 'occurrence', 'prevent', 'reduce', 'requirements', 'safety', 'second', 'tell', 'what', 'while', 'you'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '6d', 'Explain what to do in case of accidents that require emergency response in the home and backcountry. Explain what constitutes an emergency and what information you will need to provide to a responder.', ARRAY['accidents', 'aid', 'backcountry', 'case', 'class', 'constitutes', 'emergency', 'emergency response', 'explain', 'first', 'home', 'information', 'need', 'provide', 'require', 'responder', 'response', 'second', 'what', 'you'], 'First Aid');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '6e', 'Tell how you should respond if you come upon the scene of a vehicular accident.', ARRAY['accident', 'accident response', 'class', 'come', 'respond', 'safety', 'scene', 'second', 'tell', 'upon', 'vehicular', 'you'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '7a', 'After completing Tenderfoot requirement 6c be physically active at least 30 minutes each day for five days a week for four weeks. Keep track of your activities.', ARRAY['active', 'class', 'complet', 'completing', 'day', 'days', 'fitness', 'five', 'four', 'keep', 'least', 'minutes', 'physically', 'requirement', 'second', 'tenderfoot', 'track', 'week', 'weeks', 'your'], 'Fitness');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '7b', 'Share your challenges and successes in completing Second Class requirement 7a. Set a goal for continuing to include physical activity as part of your daily life and develop a plan for doing so.', ARRAY['challenges', 'class', 'complet', 'completing', 'continu', 'continuing', 'daily', 'develop', 'fitness', 'fitness goals', 'goal', 'include', 'life', 'part', 'physical', 'plan', 'requirement', 'second', 'set', 'share', 'successes', 'your'], 'Fitness');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '7c', 'Participate in a school community or troop program on the dangers of using drugs alcohol and tobacco and other practices that could be harmful to your health. Discuss your participation in the program with your family and explain the dangers of substance addictions. Report to your Scoutmaster or other adult leader in your troop about which parts of the Scout Oath and Scout Law relate to what you learned.', ARRAY['addictions', 'adult', 'alcohol', 'class', 'community', 'could', 'dangers', 'discuss', 'drugs', 'explain', 'family', 'harmful', 'health', 'law', 'leader', 'learned', 'oath', 'participate', 'participation', 'parts', 'practices', 'program', 'relate', 'report', 'school', 'scout', 'scoutmaster', 'second', 'substance', 'substance abuse', 'tobacco', 'troop', 'using', 'what', 'which', 'you', 'your'], 'Health');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '8a', 'Participate in a flag ceremony for your school religious institution chartered organization community or Scouting activity.', ARRAY['ceremony', 'chartered', 'citizenship', 'class', 'community', 'flag', 'flag ceremony', 'institution', 'organization', 'participate', 'religious', 'school', 'scout', 'scouting', 'second', 'your'], 'Citizenship');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '8b', 'Explain what respect is due the flag of the United States.', ARRAY['citizenship', 'class', 'due', 'explain', 'flag', 'flag respect', 'respect', 'second', 'states', 'united', 'what'], 'Citizenship');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '8c', 'With your parents or guardian decide on an amount of money that you would like to earn based on the cost of a specific item you would like to purchase. Develop a written plan to earn the amount agreed upon and follow that plan; it is acceptable to make changes to your plan along the way. Discuss any changes made to your original plan and whether you met your goal.', ARRAY['acceptable', 'agreed', 'along', 'amount', 'any', 'based', 'changes', 'class', 'cost', 'decide', 'develop', 'discuss', 'earn', 'follow', 'goal', 'guardian', 'item', 'like', 'made', 'make', 'management', 'met', 'money', 'original', 'parents', 'personal', 'personal management', 'plan', 'purchase', 'second', 'specific', 'upon', 'way', 'whether', 'would', 'written', 'you', 'your'], 'Personal Management');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '8d', 'At a minimum of three locations compare the cost of the item for which you are saving to determine the best place to purchase it. After completing Second Class requirement 8c decide if you will use the amount that you earned as originally intended save all or part of it or use it for another purpose.', ARRAY['amount', 'another', 'best', 'class', 'compare', 'comparison shopping', 'complet', 'completing', 'cost', 'decide', 'determine', 'earned', 'intended', 'item', 'locations', 'management', 'minimum', 'originally', 'part', 'personal', 'place', 'purchase', 'purpose', 'requirement', 'sav', 'save', 'saving', 'second', 'three', 'use', 'which', 'you'], 'Personal Management');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '8e', 'Participate in two hours of service through one or more service projects approved by your Scoutmaster. Tell how your service to others relates to the Scout Oath.', ARRAY['approved', 'class', 'hours', 'oath', 'one', 'others', 'participate', 'projects', 'relates', 'scout', 'scoutmaster', 'second', 'service', 'tell', 'two', 'your'], 'Service');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '9a', 'Explain the three R''s of personal safety and protection.', ARRAY['class', 'explain', 'personal', 'personal safety', 'protection', 'r''s', 'safety', 'second', 'three'], 'Personal Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Second Class', '9b', 'Describe bullying; tell what the appropriate response is to someone who is bullying you or another person.', ARRAY['another', 'appropriate', 'bully', 'bullying', 'class', 'describe', 'person', 'personal', 'response', 'safety', 'second', 'someone', 'tell', 'what', 'who', 'you'], 'Personal Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '1a', 'Present yourself to your leader prepared for an overnight camping trip. Show the personal and camping gear you will use. Show the right way to pack and carry it.', ARRAY['camp', 'camping', 'camping gear', 'carry', 'gear', 'leader', 'overnight', 'pack', 'personal', 'prepared', 'present', 'right', 'show', 'tenderfoot', 'trip', 'use', 'way', 'you', 'your', 'yourself'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '1b', 'Spend at least one night on a patrol or troop campout. Sleep in a tent you have helped pitch.', ARRAY['camp', 'camping', 'campout', 'helped', 'least', 'night', 'one', 'patrol', 'pitch', 'sleep', 'spend', 'tenderfoot', 'tent', 'troop', 'you'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '1c', 'Explain how you demonstrated the Outdoor Code and Leave No Trace on campouts or outings.', ARRAY['campouts', 'code', 'demonstrated', 'ethics', 'explain', 'leave', 'outdoor', 'outdoor code', 'outings', 'tenderfoot', 'trace', 'you'], 'Outdoor Ethics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '2a', 'On the campout assist in preparing one of the meals. Tell why it is important for each patrol member to share in meal preparation and cleanup.', ARRAY['assist', 'campout', 'cleanup', 'cook', 'cooking', 'important', 'meal', 'meals', 'member', 'one', 'patrol', 'prepar', 'preparation', 'preparing', 'share', 'tell', 'tenderfoot'], 'Cooking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '2b', 'While on a campout demonstrate the appropriate method of safely cleaning items used to prepare serve and eat a meal.', ARRAY['appropriate', 'camp', 'camping', 'campout', 'clean', 'cleaning', 'demonstrate', 'eat', 'items', 'meal', 'method', 'prepare', 'safely', 'serve', 'tenderfoot', 'used', 'while'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '2c', 'Explain the importance of eating together as a patrol.', ARRAY['camp', 'camping', 'eat', 'eating', 'explain', 'importance', 'patrol', 'patrol meals', 'tenderfoot', 'together'], 'Camping');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '3a', 'Demonstrate a practical use of the square knot.', ARRAY['demonstrate', 'knot', 'pioneer', 'pioneering', 'practical', 'square', 'square knot', 'tenderfoot', 'use'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '3b', 'Demonstrate a practical use of two half-hitches.', ARRAY['demonstrate', 'half', 'half-hitches', 'hitches', 'pioneer', 'pioneering', 'practical', 'tenderfoot', 'two', 'use'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '3c', 'Demonstrate a practical use of the taut-line hitch.', ARRAY['demonstrate', 'hitch', 'line', 'pioneer', 'pioneering', 'practical', 'taut', 'taut-line hitch', 'tenderfoot', 'use'], 'Pioneering');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '3d', 'Demonstrate proper care sharpening and use of the knife saw and ax. Describe when each should be used.', ARRAY['care', 'demonstrate', 'describe', 'knife', 'proper', 'saw', 'sharpen', 'sharpening', 'tenderfoot', 'tools', 'use', 'used'], 'Tools');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '4a', 'Show first aid for simple cuts and scrapes; blisters on the hand and foot; minor thermal/heat burns or scalds (superficial or first-degree); bites or stings of insects and ticks; venomous snakebite; nosebleed; frostbite and sunburn; choking.', ARRAY['aid', 'bites', 'blisters', 'burns', 'chok', 'choking', 'cuts', 'degree', 'first', 'first aid', 'foot', 'frostbite', 'hand', 'heat', 'insects', 'minor', 'nosebleed', 'scalds', 'scrapes', 'show', 'simple', 'snakebite', 'stings', 'sunburn', 'superficial', 'tenderfoot', 'thermal', 'ticks', 'venomous'], 'First Aid');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '4b', 'Describe common poisonous or hazardous plants; identify any that grow in your local area or campsite location. Tell how to treat for exposure to them.', ARRAY['any', 'area', 'campsite', 'common', 'describe', 'exposure', 'grow', 'hazardous', 'identify', 'local', 'location', 'nature', 'plants', 'poisonous', 'poisonous plants', 'tell', 'tenderfoot', 'them', 'treat', 'your'], 'Nature');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '4c', 'Tell what you can do while on a campout or other outdoor activity to prevent or reduce the occurrence of injuries or exposure listed in Tenderfoot requirements 4a and 4b.', ARRAY['campout', 'exposure', 'injuries', 'injury prevention', 'listed', 'occurrence', 'outdoor', 'prevent', 'reduce', 'requirements', 'safety', 'tell', 'tenderfoot', 'what', 'while', 'you'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '4d', 'Assemble a personal first-aid kit to carry with you on future campouts and hikes. Tell how each item in the kit would be used.', ARRAY['aid', 'assemble', 'campouts', 'carry', 'first', 'first aid kit', 'future', 'hikes', 'item', 'kit', 'personal', 'tell', 'tenderfoot', 'used', 'would', 'you'], 'First Aid');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '5a', 'Explain the importance of the buddy system as it relates to your personal safety on outings and where you live. Use the buddy system while on a troop or patrol outing.', ARRAY['buddy', 'buddy system', 'explain', 'importance', 'live', 'out', 'outing', 'outings', 'patrol', 'personal', 'relates', 'safety', 'system', 'tenderfoot', 'troop', 'use', 'while', 'you', 'your'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '5b', 'Describe what to do if you become lost on a hike or campout.', ARRAY['become', 'campout', 'describe', 'hike', 'lost', 'lost procedures', 'safety', 'tenderfoot', 'what', 'you'], 'Safety');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '5c', 'Explain the rules of safe and responsible hiking both on the highway and cross-country during the day and at night.', ARRAY['country', 'cross', 'day', 'explain', 'highway', 'hik', 'hiking', 'hiking safety', 'night', 'responsible', 'rules', 'safe', 'tenderfoot'], 'Hiking');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '5d', 'Explain why it is important to hike on trails or other durable surfaces and give examples of durable surfaces you saw on your outing.', ARRAY['durable', 'ethics', 'examples', 'explain', 'give', 'hike', 'important', 'out', 'outdoor', 'outing', 'saw', 'surfaces', 'tenderfoot', 'trails', 'you', 'your'], 'Outdoor Ethics');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '6a', 'Record your best in the following tests: push-ups (record the number done correctly in 60 seconds); sit-ups or curl-ups (record the number done correctly in 60 seconds); back-saver sit-and-reach (record the distance stretched); 1-mile walk/run (record the time).', ARRAY['back', 'best', 'correctly', 'curl', 'distance', 'done', 'fitness', 'follow', 'following', 'mile', 'number', 'push', 'reach', 'record', 'run', 'saver', 'seconds', 'sit', 'stretched', 'tenderfoot', 'tests', 'time', 'ups', 'walk', 'your'], 'Fitness');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '6b', 'Develop and describe a plan for improvement in each of the activities listed in Tenderfoot requirement 6a. Keep track of your activity for at least 30 days.', ARRAY['days', 'describe', 'develop', 'fitness', 'fitness plan', 'improvement', 'keep', 'least', 'listed', 'plan', 'requirement', 'tenderfoot', 'track', 'your'], 'Fitness');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '6c', 'Show improvement (of any degree) in each activity listed in Tenderfoot requirement 6a after practicing for 30 days.', ARRAY['any', 'days', 'degree', 'fitness', 'fitness improvement', 'improvement', 'listed', 'practic', 'practicing', 'requirement', 'show', 'tenderfoot'], 'Fitness');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '7a', 'Demonstrate how to display raise lower and fold the U.S. flag.', ARRAY['citizenship', 'demonstrate', 'display', 'flag', 'flag ceremony', 'fold', 'lower', 'raise', 'tenderfoot'], 'Citizenship');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '7b', 'Participate in a total of one hour of service in one or more service projects approved by your Scoutmaster. Explain how your service to others relates to the Scout slogan and Scout motto.', ARRAY['approved', 'explain', 'hour', 'motto', 'one', 'others', 'participate', 'projects', 'relates', 'scout', 'scoutmaster', 'service', 'slogan', 'tenderfoot', 'total', 'your'], 'Service');

INSERT INTO rank_requirements (rank, requirement_number, requirement_text, keywords, category) VALUES
('Tenderfoot', '8', 'Describe the steps in Scouting''s Teaching EDGE method. Use the Teaching EDGE method to teach another person how to tie the square knot.', ARRAY['another', 'describe', 'edge', 'knot', 'method', 'person', 'scouting''s', 'square', 'steps', 'teach', 'teaching', 'tenderfoot', 'tie', 'use'], 'Teaching');

