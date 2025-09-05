import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useDEXStore } from '@/store/dex-store';
import { securityAuditService, SecurityAuditResult, SecurityIssue } from '@/services/security-audit-service';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Loader2,
  Zap,
  Lock,
  Globe,
  Smartphone,
  Code
} from 'lucide-react';

const SecurityAudit = () => {
  const { isConnected, signer } = useDEXStore();
  const { toast } = useToast();
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAudit, setLastAudit] = useState<number | null>(null);

  const performAudit = async () => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to perform security audit",
        variant: "destructive",
      });
      return;
    }

    setIsAuditing(true);

    try {
      const result = await securityAuditService.performSecurityAudit(signer);
      setAuditResult(result);
      setLastAudit(Date.now());

      toast({
        title: "Security Audit Complete",
        description: `Security score: ${result.overallScore}/100`,
      });

    } catch (error) {
      toast({
        title: "Audit Failed",
        description: error instanceof Error ? error.message : 'Failed to perform security audit',
        variant: "destructive",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  // Auto-perform audit when wallet connects
  useEffect(() => {
    if (isConnected && signer && !auditResult) {
      performAudit();
    }
  }, [isConnected, signer]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      case 'info': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'smart-contract': return <Code className="h-4 w-4" />;
      case 'frontend': return <Smartphone className="h-4 w-4" />;
      case 'network': return <Globe className="h-4 w-4" />;
      case 'wallet': return <Lock className="h-4 w-4" />;
      case 'user-input': return <Zap className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'smart-contract': return 'Smart Contract';
      case 'frontend': return 'Frontend';
      case 'network': return 'Network';
      case 'wallet': return 'Wallet';
      case 'user-input': return 'User Input';
      default: return 'Other';
    }
  };

  return (
    <Card className="w-full card-glass border-border/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-400" />
            Security Audit
          </CardTitle>
          <Button
            onClick={performAudit}
            disabled={isAuditing || !isConnected}
            size="sm"
            variant="outline"
          >
            {isAuditing ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Auditing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Run Audit</span>
              </div>
            )}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Comprehensive security analysis of smart contracts and application
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Connect wallet to perform security audit</p>
          </div>
        ) : auditResult ? (
          <>
            {/* Security Score */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Security Score</h3>
                <Badge 
                  variant={auditResult.overallScore >= 90 ? 'default' : 'secondary'}
                  className={securityAuditService.getSecurityScoreColor(auditResult.overallScore)}
                >
                  {securityAuditService.getSecurityScoreLabel(auditResult.overallScore)}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Score</span>
                  <span className="font-semibold">{auditResult.overallScore}/100</span>
                </div>
                <Progress value={auditResult.overallScore} className="h-2" />
              </div>
            </div>

            {/* Security Issues */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Security Issues</h3>
              <div className="space-y-3">
                {auditResult.issues.length === 0 ? (
                  <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">No security issues detected</span>
                  </div>
                ) : (
                  auditResult.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 border border-border/20 rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(issue.category)}
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{issue.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {getCategoryLabel(issue.category)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div className="text-xs text-blue-700">
                            <p className="font-medium">Recommendation:</p>
                            <p>{issue.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recommendations */}
            {auditResult.recommendations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">Recommendations</h3>
                <div className="space-y-2">
                  {auditResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm text-yellow-700">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Audit Info */}
            <div className="text-xs text-muted-foreground text-center">
              Last audit: {new Date(auditResult.lastAudit).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Click "Run Audit" to perform security analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityAudit; 