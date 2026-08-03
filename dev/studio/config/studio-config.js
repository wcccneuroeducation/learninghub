export const STUDIO_CONFIG = {
  schemaVersion: 1,
  primaryDestination: "neuroSkills",
  topics: [
    { id: "sah", label: "Subarachnoid Haemorrhage" },
    { id: "evd", label: "EVD and Lumbar Drains" },
    { id: "icp", label: "ICP and Cerebral Oedema" },
    { id: "ct", label: "CT Recognition" },
    { id: "tbi", label: "Traumatic Brain Injury" }
  ],
  subtopics: [
  { id: "anatomy", label: "Anatomy" },
  { id: "physiology", label: "Physiology" },
  { id: "pathophysiology", label: "Pathophysiology" },
  { id: "causes", label: "Causes & Risk Factors" },
  { id: "presentation", label: "Presentation (Signs & Symptoms)" },
  { id: "assessment", label: "Assessment" },
  { id: "investigations", label: "Investigations" },
  { id: "diagnosis", label: "Diagnosis" },
  { id: "treatment", label: "Treatment" },
  { id: "nursing", label: "Nursing Care" },
  { id: "monitoring", label: "Monitoring" },
  { id: "complications", label: "Complications" },
  { id: "escalation", label: "Escalation" },
  { id: "medications", label: "Medications" },
  { id: "rehabilitation", label: "Rehabilitation" },
  { id: "communication", label: "Communication" },
  { id: "safety", label: "Safety" }
],
  categories: [
    { id: "knowledge", label: "Knowledge" },
    { id: "recognition", label: "Recognition" },
    { id: "assessment", label: "Assessment" },
    { id: "diagnosis", label: "Diagnosis" },
    { id: "treatment", label: "Treatment" },
    { id: "complications", label: "Complications" },
    { id: "medication", label: "Medication" },
    { id: "escalation", label: "Escalation" }
  ],
  difficulties: [
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" }
  ],
  destinations: [
    { id: "neuroSkills", label: "Neuro Skills", default: true },
    { id: "dailyNeuro", label: "Daily Neuro", default: true },
    { id: "neuroQuest", label: "Neuro Quest", default: false },
    { id: "neuroMastery", label: "Neuro Mastery", default: false }
  ]
};
