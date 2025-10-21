export interface KeyProvider {
  getActiveKey(): { id: string; secret: string }; // id=keyId
  getById(id: string): { id: string; secret: string } | null;
}
