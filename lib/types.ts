export interface Tool {
  id: string;
  name: string;
  url: string;
  description: string | null;
  tags: string[];
  created_at: string;
}
