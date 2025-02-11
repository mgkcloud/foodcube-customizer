import { NextApiRequest, NextApiResponse } from 'next';
import { debugLogger } from '@/utils/debugLogger';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const logs = debugLogger.getLogs(limit);
    res.status(200).json(logs);
  } else if (req.method === 'DELETE') {
    debugLogger.clearLogs();
    res.status(200).json({ message: 'Logs cleared' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
