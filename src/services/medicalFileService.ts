// src/services/medicalFileService.ts
import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedicalFile {
  id: string;
  patientId: string;
  doctorId: string;
  recordType:
    | 'consultation' | 'lab_result' | 'prescription' | 'vaccination'
    | 'allergy' | 'surgery' | 'hospitalization' | 'chronic_disease' | 'family_history';
  title: string;
  description?: string;
  diagnosis?: string;
  symptoms?: string[] | any;
  medications?: any[];
  labResults?: any;
  vitalSigns?: Record<string, any>;
  attachments?: any[];
  consultationDate: string;
  nextAppointment?: string;
  isCritical: boolean;
  isShared: boolean;
  doctor?: { id: string; firstName: string; lastName: string; specialty?: string };
  patient?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface PrescriptionMedication {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medications: PrescriptionMedication[];
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  validUntil?: string;
  isRead: boolean;
  doctor?: { id: string; firstName: string; lastName: string; specialty?: string };
  patient?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface VideoCall {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  roomLink: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'missed';
  notes?: string;
  doctor?: { id: string; firstName: string; lastName: string; specialty?: string };
  patient?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'stopped';
}

export interface Allergy {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  diagnosedDate: string;
  notes?: string;
}

export interface MedicalCondition {
  id: string;
  name: string;
  status: 'active' | 'resolved' | 'ongoing';
  diagnosedDate: string;
  notes?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const medicalFileService = {

  // ══════════════════════════════════════════════
  // DOSSIERS MÉDICAUX
  // ══════════════════════════════════════════════

  async getPatientMedicalFiles(patientId: string): Promise<{ success: boolean; data: MedicalFile[] }> {
    try {
      const response = await api.get(`/medical-files/patient/${patientId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ getPatientMedicalFiles:', error);
      return { success: true, data: [] };
    }
  },

  async getMedicalFileById(id: string): Promise<MedicalFile> {
    const response = await api.get(`/medical-files/${id}`);
    return response.data.data;
  },

  // ══════════════════════════════════════════════
  // PRESCRIPTIONS
  // ══════════════════════════════════════════════

  async getMyPrescriptions(): Promise<Prescription[]> {
    try {
      const response = await api.get('/prescriptions');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ getMyPrescriptions:', error);
      return [];
    }
  },

  async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      const response = await api.get(`/prescriptions/patient/${patientId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ getPatientPrescriptions:', error);
      return [];
    }
  },

  async createPrescription(data: {
    patientId: string;
    appointmentId?: string;
    medications: PrescriptionMedication[];
    notes?: string;
    validUntil?: string;
  }): Promise<Prescription> {
    const response = await api.post('/prescriptions', data);
    return response.data.data;
  },

  async markPrescriptionRead(id: string): Promise<void> {
    await api.get(`/prescriptions/${id}`); // le GET marque comme lu côté backend
  },

  // ══════════════════════════════════════════════
  // APPELS VIDÉO
  // ══════════════════════════════════════════════

  async getMyVideoCalls(): Promise<VideoCall[]> {
    try {
      const response = await api.get('/video-calls');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ getMyVideoCalls:', error);
      return [];
    }
  },

  async getPatientVideoCalls(patientId: string): Promise<VideoCall[]> {
    try {
      const response = await api.get(`/video-calls/patient/${patientId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ getPatientVideoCalls:', error);
      return [];
    }
  },

  async createVideoCall(data: {
    patientId: string;
    appointmentId?: string;
    roomLink: string;
    notes?: string;
  }): Promise<VideoCall> {
    const response = await api.post('/video-calls', data);
    return response.data.data;
  },

  async endVideoCall(id: string): Promise<void> {
    await api.patch(`/video-calls/${id}/end`);
  },

  // ══════════════════════════════════════════════
  // MÉDICAMENTS / ALLERGIES / CONDITIONS
  // (extraits des dossiers MedicalFile existants)
  // ══════════════════════════════════════════════

  async getMedications(patientId: string): Promise<Medication[]> {
    try {
      const response = await api.get(`/medical-files/patient/${patientId}`);
      const files: MedicalFile[] = response.data.data || [];
      const meds: Medication[] = [];

      files
        .filter(f => f.recordType === 'prescription' && Array.isArray(f.medications))
        .forEach(f => {
          (f.medications as any[]).forEach((m: any) => {
            meds.push({
              id: `${f.id}-${m.name}`,
              name: m.name || m.medication || 'Médicament',
              dosage: m.dosage || '',
              frequency: m.frequency || '',
              prescribedBy: f.doctor
                ? `Dr. ${f.doctor.firstName} ${f.doctor.lastName}`
                : 'Médecin',
              startDate: f.consultationDate,
              endDate: f.nextAppointment,
              status: 'active'
            });
          });
        });

      return meds;
    } catch {
      return [];
    }
  },

  async getAllergies(patientId: string): Promise<Allergy[]> {
    try {
      const response = await api.get(`/medical-files/patient/${patientId}`);
      const files: MedicalFile[] = response.data.data || [];
      return files
        .filter(f => f.recordType === 'allergy')
        .map(f => ({
          id: f.id,
          name: f.title,
          severity: (f.vitalSigns?.severity || 'mild') as Allergy['severity'],
          reaction: f.description || '',
          diagnosedDate: f.consultationDate,
          notes: f.diagnosis
        }));
    } catch {
      return [];
    }
  },

  async getMedicalConditions(patientId: string): Promise<MedicalCondition[]> {
    try {
      const response = await api.get(`/medical-files/patient/${patientId}`);
      const files: MedicalFile[] = response.data.data || [];
      return files
        .filter(f => ['chronic_disease', 'hospitalization', 'surgery'].includes(f.recordType))
        .map(f => ({
          id: f.id,
          name: f.title,
          status: 'ongoing' as MedicalCondition['status'],
          diagnosedDate: f.consultationDate,
          notes: f.description
        }));
    } catch {
      return [];
    }
  }
};
