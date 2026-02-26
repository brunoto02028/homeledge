'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Building2, User, CheckCircle2, HelpCircle, ShieldCheck } from 'lucide-react';

export interface EntityCandidate {
  entityId: string;
  entityName: string;
  entityType: string;
  confidence: number;
  matchReasons: string[];
}

export interface EntityMatchInfo {
  bestMatch: EntityCandidate | null;
  candidates: EntityCandidate[];
  autoAssign: boolean;
  needsConfirmation: boolean;
  needsManualSelection: boolean;
  mismatch: boolean;
}

interface EntityConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityMatch: EntityMatchInfo;
  contextEntityName?: string;
  documentDescription?: string;
  onConfirm: (entityId: string) => void;
  onSkip?: () => void;
}

export function EntityConfirmDialog({
  open,
  onOpenChange,
  entityMatch,
  contextEntityName,
  documentDescription,
  onConfirm,
  onSkip,
}: EntityConfirmDialogProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    entityMatch.bestMatch?.entityId || ''
  );

  const { bestMatch, candidates, mismatch, needsConfirmation, needsManualSelection } = entityMatch;

  const getIcon = (type: string) => {
    return type === 'individual' || type === 'sole_trader'
      ? <User className="h-4 w-4 text-amber-500" />
      : <Building2 className="h-4 w-4 text-blue-500" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTitle = () => {
    if (mismatch) return 'Entity Mismatch Detected';
    if (needsConfirmation) return 'Confirm Entity Assignment';
    if (needsManualSelection) return 'Select Entity';
    return 'Entity Assignment';
  };

  const getDescription = () => {
    if (mismatch && bestMatch) {
      return `The AI detected this document may belong to "${bestMatch.entityName}" instead of "${contextEntityName}". Please confirm.`;
    }
    if (needsConfirmation && bestMatch) {
      return `The AI suggests this document belongs to "${bestMatch.entityName}" (${(bestMatch.confidence * 100).toFixed(0)}% confidence). Please confirm or select a different entity.`;
    }
    if (needsManualSelection) {
      return 'The AI could not determine which entity this document belongs to. Please select one.';
    }
    return 'Please confirm the entity for this document.';
  };

  const getHeaderIcon = () => {
    if (mismatch) return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    if (needsConfirmation) return <HelpCircle className="h-5 w-5 text-blue-500" />;
    if (needsManualSelection) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    return <ShieldCheck className="h-5 w-5 text-green-500" />;
  };

  const handleConfirm = () => {
    if (selectedEntityId) {
      onConfirm(selectedEntityId);
      onOpenChange(false);
    }
  };

  const filteredCandidates = candidates.filter(c => c.confidence > 0 || candidates.length <= 3);
  const displayCandidates = filteredCandidates.length > 0 ? filteredCandidates : candidates;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getHeaderIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {documentDescription && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border">
            Document: <span className="font-medium text-foreground">{documentDescription}</span>
          </div>
        )}

        <RadioGroup
          value={selectedEntityId}
          onValueChange={setSelectedEntityId}
          className="space-y-2"
        >
          {displayCandidates.map((candidate) => (
            <div
              key={candidate.entityId}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                selectedEntityId === candidate.entityId
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedEntityId(candidate.entityId)}
            >
              <RadioGroupItem value={candidate.entityId} id={candidate.entityId} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={candidate.entityId}
                  className="flex items-center gap-2 cursor-pointer font-medium"
                >
                  {getIcon(candidate.entityType)}
                  {candidate.entityName}
                  {candidate.confidence > 0 && (
                    <Badge variant="outline" className={`text-xs ${getConfidenceColor(candidate.confidence)}`}>
                      {(candidate.confidence * 100).toFixed(0)}%
                    </Badge>
                  )}
                  {bestMatch?.entityId === candidate.entityId && candidate.confidence >= 0.5 && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Suggested
                    </Badge>
                  )}
                </Label>
                {candidate.matchReasons.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {candidate.matchReasons.map((reason, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{reason}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter className="flex gap-2 sm:gap-0">
          {onSkip && (
            <Button variant="ghost" onClick={() => { onSkip(); onOpenChange(false); }}>
              Skip
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedEntityId}>
            Confirm Entity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
