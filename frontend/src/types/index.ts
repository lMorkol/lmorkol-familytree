export interface User {
  id: number;
}

export interface Tree {
  id: number;
  name: string;
  humanId?: number | null;
  photo?: string;
}

export interface TreeInfoResponse {
  id: number;
  name: string;
  createdBy: number;
}

export interface Human {
  humanId: number;
  firstName?: string;
  secondName?: string;
  patronymic?: string;
  gender: string;
  birthDate?: string;
  deathDate?: string;
  placeOfBirth?: string;
  country?: string;
  treeId: number;
  photo?: string;
}

export interface HumanBrief {
  humanId: number;
  firstName?: string;
  secondName?: string;
  gender: string;
  photo?: string;
}

export interface Event {
  eventId: number;
  eventDate: string;
  eventEndDate?: string;
  eventDescription: string;
  name?: string;
  participants?: EventParticipant[];
  media?: EventMedia[];
}

export interface EventParticipant {
  humanId: number;
  name: string;
  role?: string;
}

export interface EventMedia {
  id: number;
  filePath: string;
  fileType: string;
  originalFilename: string;
}

export interface Relation {
  id: number;
  fromHumanId: number;
  toHumanId: number;
  relationType: string;
  relatedName?: string;
  relatedGender?: string;
  startDate?: string;
  endDate?: string;
}

export interface DataResponse<T> {
  data: T;
}

export interface ListResponse<T> {
  items: T[];
}

export interface TreeMember {
  userId: number;
  login: string;
  firstName: string;
  secondName: string;
  role: string;
  isActive: boolean;
}

export interface Media {
  id: number;
  humanId: number;
  filePath: string;
  fileType: "photo" | "video" | "audio" | "document";
  originalFilename: string;
  mimeType?: string;
  title?: string;
  description?: string;
  createdAt?: string;
}

export interface Album {
  id: number;
  humanId: number;
  name: string;
  description?: string;
  mediaCount: number;
  createdAt?: string;
}

export interface Document {
  id: number;
  humanId: number;
  docType: "passport" | "birth_certificate" | "marriage_certificate" | "vehicle_rights";
  title: string;
  description?: string;
  filePath?: string;
  issueDate?: string;
  expiryDate?: string;
  createdAt?: string;
  media?: DocumentMedia[];
}

export interface DocumentMedia {
  id: number;
  filePath: string;
  originalFilename: string;
  mimeType?: string;
}

export interface HumanAddress {
  id: number;
  humanId: number;
  country?: string;
  city?: string;
  street?: string;
  house?: string;
  apartment?: string;
  addressType?: string;
  periodStart?: string;
  periodEnd?: string;
  lat?: number;
  lng?: number;
}
