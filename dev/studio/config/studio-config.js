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
