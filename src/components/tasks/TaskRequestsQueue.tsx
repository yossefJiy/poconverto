import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/hooks/useClient';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  MessageSquare,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'ממתין', color: 'bg-warning/20 text-warning', icon: Clock },
  approved: { label: 'אושר', color: 'bg-success/20 text-success', icon: CheckCircle2 },
  rejected: { label: 'נדחה', color: 'bg-destructive/20 text-destructive', icon: XCircle },
  converted: { label: 'הופך למשימה', color: 'bg-info/20 text-info', icon: FileText },
};

interface TaskRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  estimated_credits: number | null;
  rejection_reason: string | null;
  created_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  requested_by: string | null;
  client_id: string;
  clients: { name: string } | null;
}

export function TaskRequestsQueue() {
  const { selectedClient } = useClient();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<TaskRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const isAdmin = role === 'super_admin' || role === 'admin' || role === 'agency_manager';

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['task-requests', selectedClient?.id, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('task_requests')
        .select('*, clients:clients!task_requests_client_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (selectedClient) {
        query = query.eq('client_id', selectedClient.id);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TaskRequest[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      reason, 
    }: { 
      id: string; 
      status: string; 
      reason?: string; 
    }) => {
      const updates: Record<string, unknown> = { status };
      if (reason) updates.rejection_reason = reason;
      if (status === 'approved') {
        updates.approved_by = user?.id;
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('task_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('הבקשה עודכנה');
      queryClient.invalidateQueries({ queryKey: ['task-requests'] });
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: () => {
      toast.error('שגיאה בעדכון הבקשה');
    },
  });

  const handleApprove = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      status: 'approved',
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      status: 'rejected',
      reason: rejectionReason,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          בקשות משימה
        </CardTitle>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="pending">ממתין</SelectItem>
            <SelectItem value="approved">אושר</SelectItem>
            <SelectItem value="rejected">נדחה</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>אין בקשות {filterStatus !== 'all' ? statusConfig[filterStatus]?.label : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const status = statusConfig[request.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{request.title}</h4>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {status.label}
                        </Badge>
                      </div>
                      {request.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {request.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {request.estimated_credits && (
                          <span>{request.estimated_credits} קרדיטים</span>
                        )}
                        {request.created_at && (
                          <span>{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                        )}
                      </div>
                    </div>
                    {request.clients?.name && (
                      <Badge variant="outline">{request.clients.name}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail/Action Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.title}</DialogTitle>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                {selectedRequest.description && (
                  <div>
                    <Label className="text-muted-foreground">תיאור</Label>
                    <p className="mt-1">{selectedRequest.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">סטטוס</Label>
                    <p>{statusConfig[selectedRequest.status]?.label || selectedRequest.status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">קרדיטים משוערים</Label>
                    <p>{selectedRequest.estimated_credits || '-'}</p>
                  </div>
                </div>

                {isAdmin && selectedRequest.status === 'pending' && (
                  <>
                    <div className="space-y-2">
                      <Label>סיבת דחייה (אופציונלי)</Label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="סיבת דחייה..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleApprove} 
                        className="flex-1"
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                        אישור
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleReject}
                        className="flex-1"
                        disabled={updateMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 ml-2" />
                        דחייה
                      </Button>
                    </div>
                  </>
                )}

                {selectedRequest.rejection_reason && (
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1 text-destructive">
                      <MessageSquare className="h-4 w-4" />
                      סיבת דחייה
                    </div>
                    <p className="text-sm">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
