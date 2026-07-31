export interface WorkflowStep {
  title: string;
  agentName: string;
  desc: string;
  icon: string;
}

export interface EventConfig {
  id: string;
  title: string;
  icon: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  location: string;
  agents: string[]; // Active agent IDs
  workflow: WorkflowStep[];
  reasoning: string[];
  outcomeActions: string[];
  story: string[];
  currentStepTexts: string[];
  liveFeed: { time: string; sender: string; message: string }[];
  progress?: number;
  missionDone?: boolean;
  currentStep?: number;
}

export const ALL_AGENTS_LIST = [
  { id: 'accident',    name: 'Accident Agent',      icon: '🚗', code: 'Accident' },
  { id: 'fire',        name: 'Fire Agent',           icon: '🔥', code: 'Fire' },
  { id: 'flood',       name: 'Flood Agent',          icon: '🌊', code: 'Flood' },
  { id: 'weather',     name: 'Weather Agent',        icon: '🌦', code: 'Weather' },
  { id: 'rescue',      name: 'Rescue Agent',         icon: '🚣', code: 'Rescue' },
  { id: 'comm',        name: 'Communication Agent',  icon: '📢', code: 'Communication' },
  { id: 'hospital',    name: 'Hospital Agent',       icon: '🏥', code: 'Hospital' },
  { id: 'ambulance',   name: 'Ambulance Agent',      icon: '🚑', code: 'Ambulance' },
  { id: 'police',      name: 'Police Agent',         icon: '🚔', code: 'Police' },
  { id: 'traffic',     name: 'Traffic Agent',        icon: '🚦', code: 'Traffic' },
  { id: 'drone',       name: 'Drone Agent',          icon: '🚁', code: 'Drone' },
  { id: 'factory',     name: 'Factory Agent',        icon: '🏭', code: 'Factory' },
  { id: 'power',       name: 'Power Agent',          icon: '⚡', code: 'Power' },
  { id: 'cyber',       name: 'Cyber Agent',          icon: '🛡', code: 'Cyber' },
  { id: 'security',    name: 'Security Agent',       icon: '🔒', code: 'Security' },
  { id: 'network',     name: 'Network Agent',        icon: '🌐', code: 'Network' },
  { id: 'recovery',    name: 'Recovery Agent',       icon: '💾', code: 'Recovery' },
  { id: 'agriculture', name: 'Agriculture Agent',    icon: '🌾', code: 'Agriculture' },
  { id: 'defense',     name: 'Defense Agent',        icon: '⚔', code: 'Defense' },
  { id: 'airport',     name: 'Airport Agent',        icon: '✈', code: 'Airport' },
  { id: 'repair',      name: 'Repair Team Agent',    icon: '🔧', code: 'Repair' },
];

export const EVENT_CONFIGS: Record<string, EventConfig> = {

  road_accident: {
    id: 'road_accident',
    title: 'Road Accident',
    icon: '🚗',
    severity: 'High',
    location: 'MG Road, Hyderabad',
    agents: ['accident', 'police', 'traffic', 'drone'],
    workflow: [
      { title: 'Accident Confirmed',       agentName: 'Accident Agent',   desc: 'Accident reported at MG Road.',            icon: '🚗' },
      { title: 'Police Notified',          agentName: 'Police Agent',     desc: 'Squad cars dispatched to scene.',           icon: '🚔' },
      { title: 'Traffic Cleared',          agentName: 'Traffic Agent',    desc: 'Green signal corridor activated.',          icon: '🚦' },
      { title: 'Drone Monitoring',         agentName: 'Drone Agent',      desc: 'Aerial surveillance feed active.',           icon: '🚁' },
      { title: 'Mission Completed',        agentName: 'Accident Agent',   desc: 'Road cleared. Threat resolved.',            icon: '✅' },
    ],
    reasoning: [
      'A vehicle collision was reported on MG Road.',
      'Traffic is backing up behind the accident.',
      'Police required to secure the scene.',
      'No injuries reported — ambulance not needed.',
    ],
    outcomeActions: ['Police secure cordons deployed', 'Smart signal corridor green-locked', 'Drone feed active'],
    story: ['Reported', 'Police dispatched', 'Traffic cleared', 'Drone monitoring', 'Completed'],
    currentStepTexts: [
      'Accident Confirmed. Locating scene coordinates.',
      'Police Notified. Units deploying safety blocks.',
      'Traffic Cleared. MG Road signals green-locked.',
      'Drone Monitoring. Live aerial feed streaming.',
      'Mission Completed. Road cleared and reopened.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Accident Agent',  message: 'Accident confirmed at MG Road' },
      { time: '10:43', sender: 'Police Agent',     message: 'Cruisers dispatched to secure scene' },
      { time: '10:44', sender: 'Traffic Agent',    message: 'Signals green-locked for emergency lane' },
      { time: '10:45', sender: 'Drone Agent',      message: 'Aerial surveillance feed now live' },
      { time: '10:46', sender: 'Accident Agent',   message: 'Scene cleared. Mission completed.' },
    ],
  },

  road_accident_injured: {
    id: 'road_accident_injured',
    title: 'Road Accident — Injuries Reported',
    icon: '🚗',
    severity: 'Critical',
    location: 'MG Road, Hyderabad',
    agents: ['accident', 'ambulance', 'hospital', 'police', 'traffic', 'drone'],
    workflow: [
      { title: 'Accident Confirmed',       agentName: 'Accident Agent',   desc: 'Collision confirmed with casualties.',      icon: '🚗' },
      { title: 'Ambulance Sent',           agentName: 'Ambulance Agent',  desc: 'Trauma ambulance routed to scene.',         icon: '🚑' },
      { title: 'Hospital Informed',        agentName: 'Hospital Agent',   desc: 'Emergency ward notified, ICU ready.',       icon: '🏥' },
      { title: 'Police Notified',          agentName: 'Police Agent',     desc: 'Squad cars dispatched.',                    icon: '🚔' },
      { title: 'Traffic Cleared',          agentName: 'Traffic Agent',    desc: 'Green corridor for ambulance active.',      icon: '🚦' },
      { title: 'Patient Reaching Hospital', agentName: 'Ambulance Agent', desc: 'Emergency transit in progress.',            icon: '🏥' },
      { title: 'Mission Completed',        agentName: 'Accident Agent',   desc: 'All units secure. Scene cleared.',          icon: '✅' },
    ],
    reasoning: [
      'Three people were injured in the collision.',
      'The nearest hospital has ICU beds available.',
      'The road had heavy traffic — a green corridor was created.',
      'Two ambulances were needed for the casualties.',
    ],
    outcomeActions: ['2 Ambulances dispatched', 'Police cordons deployed', 'Signal corridor green-locked', 'Drone feed active'],
    story: ['Reported', 'Confirmed', 'Ambulance dispatched', 'Hospital informed', 'Traffic cleared', 'Patient in transit', 'Completed'],
    currentStepTexts: [
      'Accident Confirmed. Casualties detected.',
      'Ambulance Sent. Nearest unit routed under emergency lights.',
      'Hospital Informed. ICU rooms pre-registered.',
      'Police Notified. Units deploying perimeter safety blocks.',
      'Traffic Cleared. MG Road signals green-locked.',
      'Patient Reaching Hospital. Emergency vitals logged.',
      'Mission Completed. Road cleared and reopened.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Accident Agent',  message: 'Accident confirmed — casualties reported' },
      { time: '10:43', sender: 'Ambulance Agent', message: 'Trauma unit dispatched, ETA 4 minutes' },
      { time: '10:44', sender: 'Hospital Agent',  message: 'ER beds pre-allocated, triage team ready' },
      { time: '10:45', sender: 'Police Agent',    message: 'Cruisers deployed — area secured' },
      { time: '10:46', sender: 'Traffic Agent',   message: 'Traffic signals green-locked for ambulance' },
      { time: '10:47', sender: 'Ambulance Agent', message: 'Patient in transit, vitals stable' },
      { time: '10:48', sender: 'Accident Agent',  message: 'Mission completed successfully' },
    ],
  },

  vehicle_fire: {
    id: 'vehicle_fire',
    title: 'Electrical Fire',
    icon: '🔥',
    severity: 'Critical',
    location: 'Jubilee Hills Road, Hyderabad',
    agents: ['fire', 'ambulance', 'hospital', 'police', 'traffic', 'drone'],
    workflow: [
      { title: 'Fire Alert Received',   agentName: 'Fire Agent',      desc: 'Voltage overload logs flag active flame.',            icon: '⚡' },
      { title: 'Fire Confirmed',        agentName: 'Fire Agent',      desc: 'Visual feeds verify electrical bus fire.',            icon: '🔍' },
      { title: 'Fire Trucks Dispatched', agentName: 'Fire Agent',     desc: 'Dry-chemical engines en route.',                     icon: '🚒' },
      { title: 'Area Evacuated',        agentName: 'Police Agent',    desc: 'Civilian blocks secured and evacuated.',              icon: '👮' },
      { title: 'Hospital Alerted',      agentName: 'Hospital Agent',  desc: 'ICU triage notified for smoke inhalation.',           icon: '🏥' },
      { title: 'Fire Extinguished',     agentName: 'Fire Agent',      desc: 'Flame suppressed. Battery packs cooled.',            icon: '🔥' },
      { title: 'Mission Completed',     agentName: 'Fire Agent',      desc: 'Structure safety confirmed. Hazard resolved.',       icon: '✅' },
    ],
    reasoning: [
      'Electrical short circuit detected on six high-voltage buses.',
      'High risk of battery pack explosions.',
      'Toxic battery fumes spreading near residential areas.',
      'Specialised dry-chemical suppression was required.',
    ],
    outcomeActions: ['2 Dry-chemical trucks dispatched', 'Road closed', 'Trauma ward on standby', 'Drone thermal feed online'],
    story: ['Reported', 'Confirmed', 'Engines dispatched', 'Area cordoned', 'Hospital alerted', 'Flame suppressed', 'Completed'],
    currentStepTexts: [
      'Electrical failure warning logs registered.',
      'Electrical fire confirmed. Initiating dynamic dispatch.',
      'Fire Trucks Dispatched. Chemical tenders en route.',
      'Area Evacuated. Road blocks secured.',
      'Hospital Alerted. ER rooms prepared.',
      'Fire Extinguished. Cooling active.',
      'Mission Completed. Hazard resolved.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Fire Agent',      message: 'Smoke and gas levels flagged red' },
      { time: '10:43', sender: 'Fire Agent',      message: '2 Dry-chem trucks dispatched' },
      { time: '10:44', sender: 'Police Agent',    message: 'Blocking lanes on Jubilee road' },
      { time: '10:45', sender: 'Ambulance Agent', message: 'Paramedics standing by for smoke inhalation' },
      { time: '10:46', sender: 'Drone Agent',     message: 'Thermal profile streaming live' },
      { time: '10:47', sender: 'Fire Agent',      message: 'Flame suppressed. Structural cooling active' },
      { time: '10:48', sender: 'Fire Agent',      message: 'Mission completed' },
    ],
  },

  building_fire: {
    id: 'building_fire',
    title: 'Building Fire',
    icon: '🔥',
    severity: 'Critical',
    location: 'Sector 2, Downtown',
    agents: ['fire', 'ambulance', 'hospital', 'police', 'drone'],
    workflow: [
      { title: 'Fire Detected',         agentName: 'Fire Agent',     desc: 'Smoke sensor triggered on third floor.',        icon: '🔥' },
      { title: 'Fire Risk Confirmed',   agentName: 'Fire Agent',     desc: 'Thermal scan verifies structural outbreak.',     icon: '🔍' },
      { title: 'Fire Trucks Dispatched', agentName: 'Fire Agent',    desc: 'Three engines dispatched to site.',              icon: '🚒' },
      { title: 'Area Evacuated',        agentName: 'Police Agent',   desc: 'Civil evacuation alerts sent out.',              icon: '👮' },
      { title: 'Hospital Alerted',      agentName: 'Hospital Agent', desc: 'Trauma ICU reserved.',                          icon: '🏥' },
      { title: 'Fire Extinguished',     agentName: 'Fire Agent',     desc: 'Core fire suppressed. Hot spots cleared.',      icon: '🔥' },
      { title: 'Mission Completed',     agentName: 'Fire Agent',     desc: 'Structure safety confirmed.',                   icon: '✅' },
    ],
    reasoning: [
      'Fire was detected on the third floor.',
      'Smoke is spreading rapidly through the building.',
      'Nearby buildings are at risk of catching fire.',
      'Three fire engines were required to suppress the blaze.',
      'Residents needed to be evacuated immediately.',
    ],
    outcomeActions: ['3 Fire engines dispatched', 'Police perimeter active', 'Drone thermal stream live', 'Paramedics standing by'],
    story: ['Detected', 'Confirmed', 'Engines dispatched', 'Evacuated', 'Hospital alerted', 'Flame suppressed', 'Completed'],
    currentStepTexts: [
      'Fire detected in third floor suite.',
      'Outbreak verified. Launching scan drones.',
      'Fire Trucks Dispatched. Engines en route.',
      'Area Evacuated. Securing Sector 2.',
      'Hospital Alerted. ICU triages prepared.',
      'Fire Extinguished. Smothering hot embers.',
      'Mission Completed. Structural safety scan cleared.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Fire Agent',      message: 'Fire truck dispatched' },
      { time: '10:43', sender: 'Police Agent',    message: 'Area secured and evacuated' },
      { time: '10:44', sender: 'Hospital Agent',  message: 'Emergency ward ready' },
      { time: '10:45', sender: 'Drone Agent',     message: 'Live thermal monitoring active' },
      { time: '10:46', sender: 'Fire Agent',      message: 'Residents being evacuated' },
      { time: '10:47', sender: 'Fire Agent',      message: 'Flame suppressed' },
      { time: '10:48', sender: 'Fire Agent',      message: 'Mission completed' },
    ],
  },

  flash_flood: {
    id: 'flash_flood',
    title: 'Flood',
    icon: '🌊',
    severity: 'Critical',
    location: 'Vijayawada',
    agents: ['flood', 'rescue', 'weather', 'drone', 'comm'],
    workflow: [
      { title: 'Flood Detected',         agentName: 'Flood Agent',   desc: 'River water rose 3 metres above threshold.',    icon: '🌊' },
      { title: 'Water Level Analysed',   agentName: 'Flood Agent',   desc: 'Satellite topography maps runoff paths.',       icon: '📊' },
      { title: 'Storm Forecast Updated', agentName: 'Weather Agent', desc: 'Thunderstorm cell predicted in 2 hours.',       icon: '🌦' },
      { title: 'Rescue Team Dispatched', agentName: 'Rescue Agent',  desc: 'Inflatables and rafts deployed to flood zone.', icon: '🚣' },
      { title: 'Evacuation Started',     agentName: 'Rescue Agent',  desc: 'Residents moved to safety hubs.',               icon: '🚶' },
      { title: 'People Rescued',         agentName: 'Rescue Agent',  desc: '12 stranded residents recovered.',              icon: '🏊' },
      { title: 'Mission Completed',      agentName: 'Flood Agent',   desc: 'Evacuations done. Water levels stabilising.',   icon: '✅' },
    ],
    reasoning: [
      'Krishna river overflowed local flood barriers.',
      'Severe waterlogging in residential areas.',
      'Satellite forecast warns of an additional thunderstorm.',
      'Boats and aerial search were needed to rescue stranded people.',
    ],
    outcomeActions: ['4 Rescue boats deployed', 'Weather sensors live-updating', 'Evacuation warnings broadcast', 'Aerial scan active'],
    story: ['Sensors alert', 'Flood mapped', 'Storm predicted', 'Rescue dispatched', 'Evacuation started', 'Citizens rescued', 'Completed'],
    currentStepTexts: [
      'Flood Detected. Sensors breach critical threshold.',
      'Water Level Analysed. Runoffs mapped by satellite.',
      'Storm Forecast Updated. Thunderstorm cell warned.',
      'Rescue Team Dispatched. Inflatable rafts en route.',
      'Evacuation Started. Setting up emergency shelter hubs.',
      'People Rescued. 12 residents secured.',
      'Mission Completed. Flood plain waters receding.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Flood Agent',         message: 'River sensor reached critical 3.2m' },
      { time: '10:43', sender: 'Weather Agent',       message: 'Storm cell predicted — 50mm rain in 2 hours' },
      { time: '10:44', sender: 'Drone Agent',         message: 'Survey drones launching to locate civilians' },
      { time: '10:45', sender: 'Rescue Agent',        message: '4 inflatable rescue boats dispatched' },
      { time: '10:46', sender: 'Communication Agent', message: 'Evacuation broadcast sent to all cell towers' },
      { time: '10:47', sender: 'Rescue Agent',        message: '12 citizens secured at emergency shelter' },
      { time: '10:48', sender: 'Flood Agent',         message: 'Mission completed successfully' },
    ],
  },

  cyber_attack: {
    id: 'cyber_attack',
    title: 'Cyber Attack',
    icon: '💻',
    severity: 'High',
    location: 'Central Database — WAN',
    agents: ['cyber', 'security', 'recovery', 'network'],
    workflow: [
      { title: 'Attack Detected',    agentName: 'Cyber Agent',    desc: 'Database CPU spiked to 100% — anomalous logs.',  icon: '💻' },
      { title: 'Threat Identified',  agentName: 'Cyber Agent',    desc: 'SQL injection routes from bad IPs mapped.',      icon: '🔍' },
      { title: 'Network Isolated',   agentName: 'Security Agent', desc: 'Access tokens revoked. Admin ports suspended.',   icon: '🔒' },
      { title: 'Firewall Enabled',   agentName: 'Network Agent',  desc: 'Router block rules written. Subnets cordoned.',   icon: '🌐' },
      { title: 'Recovery Started',   agentName: 'Recovery Agent', desc: 'Restoring schemas from encrypted backups.',       icon: '💾' },
      { title: 'System Restored',    agentName: 'Cyber Agent',    desc: 'Database patch verified. Normal logs restored.',  icon: '✅' },
    ],
    reasoning: [
      'Bank database servers were targeted by brute-force credential attacks.',
      'WAN throughput spiked, indicating active data theft.',
      'Suspicious IPs originated from unauthorised cloud domains.',
    ],
    outcomeActions: ['WAN port shut down', 'Subnet block rules updated', 'Database snapshot restored'],
    story: ['CPU spike alert', 'Threat analysed', 'Network isolated', 'Firewall cordon active', 'Transaction logs recovered', 'System restored'],
    currentStepTexts: [
      'Attack Detected. Database CPU overload warnings.',
      'Threat Identified. SQL injection vector mapped.',
      'Network Isolated. Session access tokens revoked.',
      'Firewall Enabled. Router subnet block active.',
      'Recovery Started. Restoring table partitions.',
      'System Restored. Database portal online.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Cyber Agent',    message: 'Anomaly detected: DB port overload' },
      { time: '10:43', sender: 'Security Agent', message: 'WAN ports closed. Active tokens revoked' },
      { time: '10:44', sender: 'Network Agent',  message: 'Firewall rules updated to block malicious subnets' },
      { time: '10:45', sender: 'Recovery Agent', message: 'Rebuilding table space from transactional backup' },
      { time: '10:46', sender: 'Cyber Agent',    message: 'System restored. All logs validated.' },
      { time: '10:47', sender: 'Cyber Agent',    message: 'Mission completed successfully' },
    ],
  },

  power_failure: {
    id: 'power_failure',
    title: 'Power Failure',
    icon: '⚡',
    severity: 'Medium',
    location: 'Substation B',
    agents: ['power', 'repair', 'police', 'drone'],
    workflow: [
      { title: 'Blackout Reported',   agentName: 'Power Agent',  desc: 'Line voltage dropped to zero at Substation B.',  icon: '⚡' },
      { title: 'Grid Inspected',      agentName: 'Power Agent',  desc: 'Smart transformers flag line failure.',           icon: '🔌' },
      { title: 'Faulty Node Isolated', agentName: 'Power Agent', desc: 'Faulty transformer decoupled from grid.',         icon: '🔧' },
      { title: 'Repair Team Dispatched', agentName: 'Repair Team Agent', desc: 'Engineers dispatched to Substation B.', icon: '🔧' },
      { title: 'Perimeter Secured',   agentName: 'Police Agent', desc: 'Police cruiser deployed for area safety.',       icon: '🚔' },
      { title: 'Power Restored',      agentName: 'Power Agent',  desc: 'Grid loop bypass engaged. Current restored.',    icon: '✅' },
    ],
    reasoning: [
      'A transformer explosion caused sudden loss of electricity.',
      'A voltage spike arc hazard was registered on the grid node.',
      'A police perimeter was needed for the repair team to work safely.',
    ],
    outcomeActions: ['Grid engineers dispatched', 'Transformer bypass triggered', 'Police guard deployed'],
    story: ['Voltage drop', 'Substation inspected', 'Faulty node isolated', 'Perimeter secured', 'Power restored'],
    currentStepTexts: [
      'Blackout Reported. Voltage drop logged at node B.',
      'Grid Inspected. Transformer thermal logs flag failure.',
      'Faulty Node Isolated. Decoupling faulty circuit loops.',
      'Repair Team Dispatched. Engineers en route.',
      'Perimeter Secured. Squad car deployed.',
      'Power Restored. Grid loop active. Normal load flow.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Power Agent',       message: 'Voltage dropped to zero at node B' },
      { time: '10:43', sender: 'Drone Agent',        message: 'Thermal scan dispatched to check transformer' },
      { time: '10:44', sender: 'Repair Team Agent',  message: 'Engineers en route to Substation B' },
      { time: '10:45', sender: 'Police Agent',       message: 'Cruisers deployed around station' },
      { time: '10:46', sender: 'Power Agent',        message: 'Grid bypass engaged — routing backup lines' },
      { time: '10:47', sender: 'Power Agent',        message: 'Power restored to grid sector B' },
    ],
  },

  industrial_accident: {
    id: 'industrial_accident',
    title: 'Industrial Accident',
    icon: '🏭',
    severity: 'High',
    location: 'Factory Zone A',
    agents: ['factory', 'rescue', 'power', 'police', 'drone', 'ambulance', 'hospital'],
    workflow: [
      { title: 'Explosion Alert',          agentName: 'Factory Agent',   desc: 'Boiler 4 pressure vessel shell breached.',   icon: '🏭' },
      { title: 'Pressure Valves Activated', agentName: 'Factory Agent',  desc: 'Emergency steam ventilation valves opened.', icon: '🔧' },
      { title: 'Workers Evacuated',        agentName: 'Rescue Agent',    desc: 'Hazmat squads guiding workers out.',         icon: '🚶' },
      { title: 'Electricity Isolated',     agentName: 'Power Agent',     desc: 'Circuit breaker cut to prevent arcing.',     icon: '🔌' },
      { title: 'Hazmat Scan Active',       agentName: 'Drone Agent',     desc: 'Drones scanning for toxic gas leaks.',       icon: '🚁' },
      { title: 'Casualties Treated',       agentName: 'Ambulance Agent', desc: 'Paramedics treating steam burn injuries.',   icon: '🚑' },
      { title: 'Mission Completed',        agentName: 'Factory Agent',   desc: 'Boilers cooled. Scene stabilised.',          icon: '✅' },
    ],
    reasoning: [
      'Boiler unit 4 pressure shell exploded.',
      'High risk of steam burns and gas leakage.',
      'Multiple workers were reported trapped inside the reactor hall.',
    ],
    outcomeActions: ['Valve overrides triggered', 'Hazmat squad dispatched', 'Power grid isolated', 'ICU beds pre-reserved'],
    story: ['Explosion reported', 'Safety valves active', 'Hall evacuated', 'Electricity cut', 'Hazmat scan', 'Casualties treated', 'Completed'],
    currentStepTexts: [
      'Explosion Alert. Structural logs warning.',
      'Pressure Valves Activated. Emergency steam venting.',
      'Workers Evacuated. Guiding workers to assembly points.',
      'Electricity Isolated. Breakers shut down.',
      'Hazmat Scan Active. Toxic gas sensors monitoring.',
      'Casualties Treated. Paramedics treating injuries.',
      'Mission Completed. Boilers cooled and stabilised.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Factory Agent',   message: 'Boiler 4 pressure shell breach detected' },
      { time: '10:43', sender: 'Power Agent',     message: 'Grid breaker triggered to prevent electrical arcs' },
      { time: '10:44', sender: 'Rescue Agent',    message: 'Hazmat evacuation squad entering reactor hall' },
      { time: '10:45', sender: 'Ambulance Agent', message: 'Paramedics dispatched for steam burn injuries' },
      { time: '10:46', sender: 'Drone Agent',     message: 'Thermal scan clear — no toxic gas detected' },
      { time: '10:47', sender: 'Hospital Agent',  message: 'ER trauma centre prepared for incoming patients' },
      { time: '10:48', sender: 'Factory Agent',   message: 'Mission completed. Scene stabilised.' },
    ],
  },

  medical_emergency: {
    id: 'medical_emergency',
    title: 'Medical Emergency',
    icon: '🏥',
    severity: 'High',
    location: 'City Centre, Hyderabad',
    agents: ['ambulance', 'hospital', 'police'],
    workflow: [
      { title: 'Emergency Reported',  agentName: 'Hospital Agent',  desc: 'Critical patient influx at City Centre.',        icon: '🏥' },
      { title: 'Ambulance Dispatched', agentName: 'Ambulance Agent', desc: 'Nearest units routed under emergency lights.',   icon: '🚑' },
      { title: 'Hospital Prepared',   agentName: 'Hospital Agent',  desc: 'ICU beds reserved. Trauma team standing by.',    icon: '🏥' },
      { title: 'Patient in Transit',  agentName: 'Ambulance Agent', desc: 'Patient vitals monitored during transport.',      icon: '🚑' },
      { title: 'Patient Admitted',    agentName: 'Hospital Agent',  desc: 'Patient received by emergency triage team.',     icon: '🏥' },
      { title: 'Mission Completed',   agentName: 'Hospital Agent',  desc: 'Patient stabilised successfully.',               icon: '✅' },
    ],
    reasoning: [
      'A critical medical emergency was reported at City Centre.',
      'The nearest hospital had available ICU beds.',
      'Emergency transit was needed within 8 minutes.',
    ],
    outcomeActions: ['2 Ambulances dispatched', 'ICU room locked', 'Trauma team alerted'],
    story: ['Emergency reported', 'Ambulance dispatched', 'Hospital prepared', 'Patient in transit', 'Patient admitted', 'Completed'],
    currentStepTexts: [
      'Emergency Reported. Critical situation at City Centre.',
      'Ambulance Dispatched. Nearest unit en route.',
      'Hospital Prepared. ICU rooms pre-registered.',
      'Patient in Transit. Vitals being monitored live.',
      'Patient Admitted. Triage team receiving patient.',
      'Mission Completed. Patient stabilised.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Hospital Agent',  message: 'Critical emergency reported at City Centre' },
      { time: '10:43', sender: 'Ambulance Agent', message: 'Unit dispatched — ETA 6 minutes' },
      { time: '10:44', sender: 'Hospital Agent',  message: 'ICU bed locked. Trauma team standing by.' },
      { time: '10:45', sender: 'Ambulance Agent', message: 'Patient in transit, vitals stable' },
      { time: '10:46', sender: 'Hospital Agent',  message: 'Patient admitted to emergency ward' },
      { time: '10:47', sender: 'Hospital Agent',  message: 'Mission completed. Patient stabilised.' },
    ],
  },

  airport_emergency: {
    id: 'airport_emergency',
    title: 'Airport Emergency',
    icon: '✈',
    severity: 'High',
    location: 'International Airport',
    agents: ['airport', 'ambulance', 'hospital', 'police', 'drone'],
    workflow: [
      { title: 'Emergency Declared',   agentName: 'Airport Agent',   desc: 'Aircraft declared emergency on approach.',       icon: '✈' },
      { title: 'Runway Cleared',       agentName: 'Airport Agent',   desc: 'All runway traffic halted. Landing cleared.',    icon: '🛬' },
      { title: 'Crash Teams On Standby', agentName: 'Ambulance Agent', desc: 'Medical crash teams deployed to runway.',    icon: '🚑' },
      { title: 'Police Perimeter Set', agentName: 'Police Agent',    desc: 'Security perimeter established.',               icon: '🚔' },
      { title: 'Aircraft Landed',      agentName: 'Airport Agent',   desc: 'Emergency landing completed safely.',           icon: '✅' },
      { title: 'Mission Completed',    agentName: 'Airport Agent',   desc: 'Passengers evacuated. Scene secured.',          icon: '✅' },
    ],
    reasoning: [
      'An aircraft declared an emergency due to technical failure.',
      'The runway needed to be cleared immediately for an emergency landing.',
      'Medical crash teams were needed on standby.',
    ],
    outcomeActions: ['Runway cleared', 'Medical crash teams deployed', 'Police perimeter active'],
    story: ['Emergency declared', 'Runway cleared', 'Crash teams deployed', 'Perimeter set', 'Aircraft landed', 'Completed'],
    currentStepTexts: [
      'Emergency Declared. Aircraft reporting technical issue.',
      'Runway Cleared. All traffic halted for emergency landing.',
      'Crash Teams On Standby. Medical crew at runway.',
      'Police Perimeter Set. Security blocks in place.',
      'Aircraft Landed. Emergency landing successful.',
      'Mission Completed. Passengers safe.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Airport Agent',   message: 'Aircraft declared emergency — engine failure' },
      { time: '10:43', sender: 'Airport Agent',   message: 'Runway 2L cleared for emergency landing' },
      { time: '10:44', sender: 'Ambulance Agent', message: 'Medical crash teams at runway threshold' },
      { time: '10:45', sender: 'Police Agent',    message: 'Security perimeter established' },
      { time: '10:46', sender: 'Airport Agent',   message: 'Emergency landing completed safely' },
      { time: '10:47', sender: 'Airport Agent',   message: 'Mission completed. All passengers safe.' },
    ],
  },

  agriculture_emergency: {
    id: 'agriculture_emergency',
    title: 'Agriculture Emergency',
    icon: '🌾',
    severity: 'Medium',
    location: 'Rural Farm District',
    agents: ['agriculture', 'weather', 'drone', 'comm'],
    workflow: [
      { title: 'Crop Alert Received',  agentName: 'Agriculture Agent', desc: 'Soil moisture sensors report critical levels.', icon: '🌾' },
      { title: 'Field Assessed',       agentName: 'Agriculture Agent', desc: 'Drone survey maps affected crop areas.',        icon: '🚁' },
      { title: 'Weather Checked',      agentName: 'Weather Agent',     desc: 'Rainfall forecast computed for next 48h.',     icon: '🌦' },
      { title: 'Irrigation Activated', agentName: 'Agriculture Agent', desc: 'Water pumps activated in affected sectors.',   icon: '💧' },
      { title: 'Farmers Notified',     agentName: 'Communication Agent', desc: 'SMS alerts sent to all registered farmers.', icon: '📢' },
      { title: 'Mission Completed',    agentName: 'Agriculture Agent', desc: 'Crop hydration restored. Situation stable.',   icon: '✅' },
    ],
    reasoning: [
      'Soil moisture dropped below critical threshold in Sector C.',
      'Crop risk of wilting within 24 hours without intervention.',
      'Rainfall not expected for the next 72 hours.',
    ],
    outcomeActions: ['Irrigation pumps activated', 'Drone survey complete', 'Farmer alerts sent'],
    story: ['Moisture alert', 'Field surveyed', 'Weather checked', 'Irrigation started', 'Farmers notified', 'Completed'],
    currentStepTexts: [
      'Crop Alert Received. Soil moisture critically low.',
      'Field Assessed. Drone survey mapping affected areas.',
      'Weather Checked. No rain expected for 72 hours.',
      'Irrigation Activated. Water pumps running in Sector C.',
      'Farmers Notified. SMS alerts dispatched.',
      'Mission Completed. Crop hydration restored.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Agriculture Agent',  message: 'Soil moisture sensors below critical level' },
      { time: '10:43', sender: 'Drone Agent',         message: 'Survey drone mapping affected crop zones' },
      { time: '10:44', sender: 'Weather Agent',       message: 'No rainfall predicted for next 72 hours' },
      { time: '10:45', sender: 'Agriculture Agent',  message: 'Irrigation pumps activated in Sector C' },
      { time: '10:46', sender: 'Communication Agent', message: 'SMS alerts sent to 240 registered farmers' },
      { time: '10:47', sender: 'Agriculture Agent',  message: 'Mission completed. Crop situation stable.' },
    ],
  },

  defense_intrusion: {
    id: 'defense_intrusion',
    title: 'Security Intrusion',
    icon: '🛡',
    severity: 'Critical',
    location: 'Border Sector 4',
    agents: ['defense', 'drone', 'police', 'comm'],
    workflow: [
      { title: 'Intrusion Detected',     agentName: 'Defense Agent', desc: 'Border sensor triggered — unauthorised crossing.', icon: '🛡' },
      { title: 'Drones Deployed',        agentName: 'Drone Agent',   desc: 'Surveillance drones airborne over sector.',        icon: '🚁' },
      { title: 'Area Locked Down',       agentName: 'Defense Agent', desc: 'Sector 4 gates sealed and patrols activated.',     icon: '🔒' },
      { title: 'Police Notified',        agentName: 'Police Agent',  desc: 'Law enforcement dispatched to border point.',      icon: '🚔' },
      { title: 'Threat Contained',       agentName: 'Defense Agent', desc: 'Intrusion contained and perimeter re-secured.',    icon: '🛡' },
      { title: 'Mission Completed',      agentName: 'Defense Agent', desc: 'Threat neutralised. Report filed.',                icon: '✅' },
    ],
    reasoning: [
      'An unauthorised crossing was detected at Border Sector 4.',
      'Drone surveillance was needed to confirm the intrusion path.',
      'A rapid lockdown was required to contain the threat.',
    ],
    outcomeActions: ['Sector locked down', 'Drone swarm deployed', 'Police dispatched'],
    story: ['Sensor triggered', 'Drones airborne', 'Sector locked', 'Police dispatched', 'Threat contained', 'Completed'],
    currentStepTexts: [
      'Intrusion Detected. Unauthorised crossing at Sector 4.',
      'Drones Deployed. Aerial surveillance airborne.',
      'Area Locked Down. Sector gates sealed.',
      'Police Notified. Law enforcement en route.',
      'Threat Contained. Perimeter re-secured.',
      'Mission Completed. Report filed.',
    ],
    liveFeed: [
      { time: '10:42', sender: 'Defense Agent', message: 'Border sensor triggered at Sector 4' },
      { time: '10:43', sender: 'Drone Agent',   message: 'Surveillance drones airborne over sector' },
      { time: '10:44', sender: 'Defense Agent', message: 'Sector 4 gates sealed — patrol activated' },
      { time: '10:45', sender: 'Police Agent',  message: 'Law enforcement dispatched to border point' },
      { time: '10:46', sender: 'Defense Agent', message: 'Intrusion contained — perimeter re-secured' },
      { time: '10:47', sender: 'Defense Agent', message: 'Mission completed. Report filed.' },
    ],
  },

  unclassified: {
    id: 'unclassified',
    title: 'Unclassified Event',
    icon: '❓',
    severity: 'Low',
    location: 'Unknown',
    agents: [],
    workflow: [
      { title: 'Event Reported',    agentName: 'AIOS Kernel', desc: 'Event received but could not be classified.', icon: '❓' },
      { title: 'Awaiting Details',  agentName: 'AIOS Kernel', desc: 'Please describe the problem in more detail.',  icon: '💬' },
    ],
    reasoning: [
      'The input could not be matched to any known event category.',
      'More details are needed to determine the correct response.',
      'Please describe the emergency or incident with more specifics.',
    ],
    outcomeActions: ['Awaiting user clarification'],
    story: ['Reported', 'Awaiting classification'],
    currentStepTexts: [
      'Event Reported. Classification uncertain.',
      'Awaiting Details. Please provide more information.',
    ],
    liveFeed: [
      { time: '--:--', sender: 'AIOS Kernel', message: 'Unable to determine event type. Please describe the problem in more detail.' },
    ],
  },

};

// ── Synonym Dictionary ───────────────────────────────────────────────────────
// Each category maps to an array of synonym phrases.
// Multi-word phrases are scored higher than single words to reduce false positives.

const SYNONYM_DICTIONARY: Record<string, string[]> = {
  power_failure: [
    'power gone', 'power outage', 'power cut', 'power failure', 'power lost',
    'no power', 'no electricity', 'no current', 'current gone', 'current is not coming',
    'electricity gone', 'electricity lost', 'electricity failed', 'electricity cut',
    'grid failure', 'grid down', 'grid collapsed',
    'transformer exploded', 'transformer failed', 'transformer blew',
    'transformer burst', 'transformer fire', 'transformer damaged',
    'blackout', 'brownout', 'voltage drop', 'voltage failure',
    'substation', 'substation failure', 'substation exploded',
    'power grid', 'power line down', 'power line fell',
    'electric pole fell', 'electric pole broken',
    'no light', 'lights gone', 'lights out',
  ],
  vehicle_fire: [
    'short circuit', 'short circuited', 'buses short circuited',
    'bus short circuit', 'electric bus fire', 'electrical fire',
    'electrical short', 'wiring fire', 'cable fire',
    'bus caught fire', 'bus burning', 'bus on fire',
    'vehicle caught fire', 'vehicle fire', 'car fire',
    'engine fire', 'battery fire', 'battery explosion',
    'electric vehicle fire', 'ev fire', 'ev battery fire',
  ],
  building_fire: [
    'building fire', 'building is burning', 'building is on fire',
    'building on fire', 'building caught fire', 'building ablaze',
    'house fire', 'house is burning', 'house on fire',
    'apartment fire', 'apartment burning', 'apartment on fire',
    'office fire', 'office burning', 'office on fire',
    'warehouse fire', 'godown fire', 'shop fire',
    'mall fire', 'mall burning', 'factory fire',
    'wildfire', 'wild fire', 'forest fire', 'jungle fire',
    'bush fire', 'bushfire', 'grassland fire',
    'fire', 'burning', 'blaze', 'flames', 'smoke',
    'inferno', 'conflagration', 'arson',
  ],
  flash_flood: [
    'flood', 'flooding', 'flooded', 'flash flood',
    'water entered house', 'water entered houses',
    'village flooded', 'village is flooded', 'my village is flooded',
    'heavy rain', 'heavy rainfall', 'rain water',
    'river overflow', 'river overflowed', 'river flooded',
    'water level rising', 'water level high',
    'deluge', 'inundation', 'waterlogging', 'water logging',
    'dam burst', 'dam break', 'dam overflowed',
    'tsunami', 'tidal wave', 'storm surge',
    'cyclone flood', 'hurricane flood',
  ],
  cyber_attack: [
    'cyber attack', 'cyberattack', 'cyber threat',
    'hacked', 'hack', 'hacking', 'hacker',
    'data leak', 'data breach', 'data stolen',
    'server hacked', 'server attack', 'server breach',
    'database breach', 'database hack', 'database attack',
    'ransomware', 'malware', 'virus attack', 'virus detected',
    'trojan', 'spyware', 'phishing', 'ddos',
    'network attack', 'network breach', 'network intrusion',
    'bank server', 'bank hacked', 'system compromised',
    'identity theft', 'credential theft',
  ],
  road_accident: [
    'road accident', 'car accident', 'car crash', 'car collision',
    'bus accident', 'bus crash', 'bus collision',
    'truck accident', 'truck crash', 'truck collision',
    'vehicle accident', 'vehicle crash', 'vehicle collision',
    'bike accident', 'bike crash', 'motorbike accident',
    'auto accident', 'auto crash', 'auto collision',
    'hit and run', 'highway accident', 'highway crash',
    'road crash', 'road collision', 'traffic accident',
    'bus collided with truck', 'car hit', 'truck hit',
    'pileup', 'pile up', 'multi vehicle crash',
    'pedestrian hit', 'pedestrian accident',
  ],
  road_accident_injured: [
    'accident with injuries', 'accident injuries reported',
    'people injured in accident', 'crash with casualties',
    'fatal accident', 'fatal crash', 'people dead in accident',
    'people hurt in crash', 'people died in accident',
  ],
  industrial_accident: [
    'industrial accident', 'factory accident', 'factory explosion',
    'boiler explosion', 'boiler exploded', 'boiler burst',
    'factory boiler', 'pressure vessel', 'pressure vessel burst',
    'chemical spill', 'chemical leak', 'gas leak',
    'hazmat', 'hazardous material', 'hazardous spill',
    'toxic leak', 'toxic gas', 'toxic fumes',
    'refinery explosion', 'plant explosion', 'mine collapse',
    'mine accident', 'mining accident',
  ],
  medical_emergency: [
    'medical emergency', 'person fainted', 'person collapsed',
    'heart attack', 'cardiac arrest', 'stroke',
    'unconscious', 'not breathing', 'breathing difficulty',
    'patient critical', 'hospital emergency',
    'someone fainted', 'someone collapsed', 'someone unconscious',
    'epileptic seizure', 'seizure', 'diabetic emergency',
    'allergic reaction', 'anaphylaxis', 'choking',
    'bleeding heavily', 'severe bleeding', 'haemorrhage',
    'overdose', 'drug overdose', 'poisoning',
    'snake bite', 'animal attack', 'dog bite',
  ],
  airport_emergency: [
    'airport emergency', 'aircraft emergency',
    'plane crash', 'plane emergency', 'airplane crash',
    'flight emergency', 'runway blocked', 'runway accident',
    'airport runway blocked', 'landing gear failure',
    'engine failure aircraft', 'bird strike',
    'pilot emergency', 'aviation emergency',
    'helicopter crash', 'helicopter emergency',
    'mid air collision', 'turbulence emergency',
  ],
  agriculture_emergency: [
    'crop failure', 'crop emergency', 'crop disease',
    'farm emergency', 'farm fire', 'farm flood',
    'agriculture emergency', 'agriculture crisis',
    'harvest failure', 'harvest destroyed',
    'irrigation failed', 'irrigation broken',
    'soil erosion', 'drought', 'drought emergency',
    'pest attack', 'locust attack', 'locust swarm',
    'cattle disease', 'livestock emergency',
  ],
  defense_intrusion: [
    'security intrusion', 'border intrusion', 'border crossing',
    'unauthorised crossing', 'unauthorized crossing',
    'military threat', 'military intrusion',
    'defense breach', 'defense alert',
    'invasion', 'infiltration', 'infiltrator',
    'bomb blast', 'bomb threat', 'bomb detected',
    'explosion', 'blast', 'bombing',
    'terrorist attack', 'terrorism', 'terror threat',
    'security threat', 'suspicious package',
    'hostage', 'hostage situation', 'kidnapping',
    'shooting', 'gunfire', 'armed threat',
  ],
};

// ─── NLU Classifier v2 ──────────────────────────────────────────────────────
// Synonym dictionary + weighted scoring. NEVER defaults to road_accident.

export interface ClassificationResult {
  category: string;
  confidence: number;
}

export function classifyEvent(inputText: string): string {
  const result = classifyEventWithConfidence(inputText);
  return result.category;
}

export function classifyEventWithConfidence(inputText: string): ClassificationResult {
  if (!inputText || !inputText.trim()) {
    return { category: 'unclassified', confidence: 0 };
  }

  const t = inputText.toLowerCase().trim();

  let bestCategory = '';
  let bestScore = 0;

  for (const [category, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
    // Sort synonyms by length (longest first) for priority matching
    const sorted = [...synonyms].sort((a, b) => b.length - a.length);
    for (const phrase of sorted) {
      if (t.includes(phrase)) {
        const wordCount = phrase.split(/\s+/).length;
        // Multi-word exact match = higher confidence
        const phraseConfidence = Math.min(0.5 + wordCount * 0.15, 1.0);
        if (phraseConfidence > bestScore) {
          bestScore = phraseConfidence;
          bestCategory = category;
          if (bestScore >= 0.95) break;
        }
      }
    }
    if (bestScore >= 0.95) break;
  }

  if (bestCategory && bestScore >= 0.5) {
    const finalConfidence = Math.min(bestScore * 0.7 + 0.3 + 0.1, 1.0);

    // Special: check for injuries in road accident context
    if (bestCategory === 'road_accident') {
      const injuryWords = ['injur', 'hurt', 'casualt', 'wound', 'dead', 'die', 'fatal', 'killed', 'people'];
      if (injuryWords.some(w => t.includes(w))) {
        bestCategory = 'road_accident_injured';
      }
    }

    return { category: bestCategory, confidence: Math.round(finalConfidence * 100) / 100 };
  }

  // NEVER default to road_accident — return unclassified
  return { category: 'unclassified', confidence: 0 };
}

