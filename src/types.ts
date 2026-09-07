export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export type TextContentType = 'otp' | 'url' | 'code' | 'text';

export interface StreamMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderDevice: DeviceType;
  text: string;
  timestamp: number;
  isSelf: boolean;
  contentType: TextContentType;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  joinedAt: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
