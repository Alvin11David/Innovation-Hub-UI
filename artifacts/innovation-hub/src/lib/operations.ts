import { useEffect, useState } from 'react';

export type OperationsManager = {
  id: string;
  name: string;
  role: 'Co-manager · Admin';
};

export type OperationsDepartment = {
  id: string;
  name: string;
  manager: string;
  mentor: string;
  supervisedGroup: string;
  createdAt: string;
};

export type StartupStage =
  | 'Idea'
  | 'Validation'
  | 'Prototype'
  | 'Pilot'
  | 'Early growth'
  | 'Scaling';

export type StartupMentorship = {
  id: string;
  startupName: string;
  founder: string;
  department: string;
  mentor: string;
  stage: StartupStage;
  capacityNeeds: string;
  nextFollowUp: string;
  notes: string;
};

export type PartnerMouStatus = 'Required' | 'Under review' | 'Signed';

export type InnovationPartner = {
  id: string;
  name: string;
  contact: string;
  purpose: string;
  mouStatus: PartnerMouStatus;
  mouReference: string;
};

export const trainingCourses = [
  'Photography',
  'Videography',
  'Campaign marketing & branding',
  'Production & sound mixing',
] as const;

export type TrainingCourse = (typeof trainingCourses)[number];

export type TrainingSession = {
  id: string;
  course: TrainingCourse;
  instructor: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
};

export type TrainingPayment = {
  id: string;
  sessionId: string;
  traineeName: string;
  amount: number;
  currency: string;
  transactionReference: string;
  proofFileName: string;
  proofFileId: string;
  status: 'Pending review' | 'Verified' | 'Needs update';
  submittedAt: string;
};

export type PodAsset = {
  id: string;
  name: string;
  category: string;
  status: 'Available' | 'In use at the Pod' | 'Needs repair';
  assignedTo: string;
  issue: string;
  managerNotified: boolean;
  updatedAt: string;
};

export type TrainingPaymentSettings = {
  amount: string;
  currency: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  published: boolean;
  whatsappGroupUrl: string;
};

export type OperationsPolicies = {
  briefRouting: string;
  staffing: string;
  equipment: string;
};

export type OperationsState = {
  managers: OperationsManager[];
  departments: OperationsDepartment[];
  startups: StartupMentorship[];
  partners: InnovationPartner[];
  sessions: TrainingSession[];
  payments: TrainingPayment[];
  assets: PodAsset[];
  paymentSettings: TrainingPaymentSettings;
  policies: OperationsPolicies;
};

export const operationsManagers: OperationsManager[] = [
  { id: 'manager-magrete', name: 'Dr. Magrete', role: 'Co-manager · Admin' },
  { id: 'manager-michelle', name: 'Prof. Michelle', role: 'Co-manager · Admin' },
];

const createInitialOperationsState = (): OperationsState => ({
  managers: operationsManagers,
  departments: [],
  startups: [],
  partners: [],
  sessions: [],
  payments: [],
  assets: [],
  paymentSettings: {
    amount: '',
    currency: 'UGX',
    bankName: '',
    accountName: '',
    accountNumber: '',
    instructions: '',
    published: false,
    whatsappGroupUrl: '',
  },
  policies: {
    briefRouting:
      'Students and members of the public submit project briefs to reception. Reception logs each brief and forwards it to the relevant department in UniPod.',
    staffing:
      'There are no full-time members. Training is delivered through scheduled classes led by an assigned instructor.',
    equipment:
      'UniPod equipment stays on-site. Record on-site use, and report repairs to the managers.',
  },
});

const storageKey = 'innovation-hub-operations-state';

function readOperationsState(): OperationsState {
  const initial = createInitialOperationsState();

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return initial;

    const saved = JSON.parse(stored) as Partial<OperationsState>;
    return {
      ...initial,
      ...saved,
      managers: operationsManagers,
      paymentSettings: {
        ...initial.paymentSettings,
        ...(saved.paymentSettings ?? {}),
      },
      policies: { ...initial.policies, ...(saved.policies ?? {}) },
    };
  } catch {
    return initial;
  }
}

export function useOperationsState() {
  const [state, setState] = useState<OperationsState>(readOperationsState);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Keep the current view usable if browser storage is unavailable.
    }
  }, [state]);

  return [state, setState] as const;
}
