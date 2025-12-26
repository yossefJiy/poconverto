import { useState } from 'react';
import { User, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  name_en: string | null;
  name_hi: string | null;
  departments: string[];
  email: string | null;
  is_active: boolean;
}

interface TeamMemberCardProps {
  member: TeamMember;
  onUpdate: (id: string, updates: Partial<TeamMember>) => void;
  isLoading?: boolean;
}

export function TeamMemberCard({ member, onUpdate, isLoading }: TeamMemberCardProps) {
  const { t, language } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: member.name,
    name_en: member.name_en || '',
    name_hi: member.name_hi || '',
  });

  const handleSave = () => {
    onUpdate(member.id, {
      name: editData.name,
      name_en: editData.name_en || null,
      name_hi: editData.name_hi || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: member.name,
      name_en: member.name_en || '',
      name_hi: member.name_hi || '',
    });
    setIsEditing(false);
  };

  const displayName = language === 'en' && member.name_en 
    ? member.name_en 
    : language === 'hi' && member.name_hi 
      ? member.name_hi 
      : member.name;

  return (
    <div className={cn(
      "glass rounded-xl p-6 transition-all",
      !member.is_active && "opacity-50"
    )}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
          {displayName.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">🇮🇱 עברית</label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">🇬🇧 English</label>
                <Input
                  value={editData.name_en}
                  onChange={(e) => setEditData(prev => ({ ...prev, name_en: e.target.value }))}
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">🇮🇳 हिंदी</label>
                <Input
                  value={editData.name_hi}
                  onChange={(e) => setEditData(prev => ({ ...prev, name_hi: e.target.value }))}
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={isLoading}>
                  <Check className="w-4 h-4 mr-1" />
                  {t('save')}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{displayName}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Show all name translations */}
              <div className="text-xs text-muted-foreground mb-3 space-y-0.5">
                {language !== 'he' && <div>🇮🇱 {member.name}</div>}
                {language !== 'en' && member.name_en && <div>🇬🇧 {member.name_en}</div>}
                {language !== 'hi' && member.name_hi && <div>🇮🇳 {member.name_hi}</div>}
              </div>
            </>
          )}
          
          {!isEditing && (
            <div className="flex flex-wrap gap-1.5">
              {member.departments.map((dept, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {dept}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
