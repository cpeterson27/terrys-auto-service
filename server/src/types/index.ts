export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'admin' | 'customer';
  emailVerified?: boolean;
  marketingOptIn?: boolean;
  marketingOptInAt?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  accountDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInvoice {
  _id?: string;
  invoiceNumber: string;
  customerId: string;
  totalAmount: number;
  taxAmount: number;
  subtotal: number;
  items: IInvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issuedDate: Date;
  dueDate: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IBooking {
  _id?: string;
  customerId: string;
  serviceDate: Date;
  serviceTime: string;
  vehicleInfo: string;
  services?: string[];
  description: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExpense {
  _id?: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  receipt?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGalleryItem {
  _id?: string;
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  category?: string;
  cloudinaryPublicId?: string;
  additionalMedia?: IGalleryMedia[];
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGalleryMedia {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  cloudinaryPublicId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
}
