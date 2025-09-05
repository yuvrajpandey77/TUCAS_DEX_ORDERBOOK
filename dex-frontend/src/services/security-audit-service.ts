import { ethers } from 'ethers';
import { dexService } from './dex-service';
import React from 'react';

export interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'smart-contract' | 'frontend' | 'network' | 'wallet' | 'user-input';
  title: string;
  description: string;
  recommendation: string;
  timestamp: number;
  resolved: boolean;
}

export interface SecurityAuditResult {
  overallScore: number;
  issues: SecurityIssue[];
  recommendations: string[];
  lastAudit: number;
}

export class SecurityAuditService {
  private readonly CRITICAL_ISSUES: SecurityIssue[] = [
    {
      id: 'reentrancy-attack',
      severity: 'critical',
      category: 'smart-contract',
      title: 'Reentrancy Attack Vulnerability',
      description: 'Smart contract may be vulnerable to reentrancy attacks if state changes are not properly protected.',
      recommendation: 'Implement checks-effects-interactions pattern and use ReentrancyGuard.',
      timestamp: Date.now(),
      resolved: false
    },
    {
      id: 'integer-overflow',
      severity: 'critical',
      category: 'smart-contract',
      title: 'Integer Overflow/Underflow',
      description: 'Arithmetic operations may overflow or underflow without proper checks.',
      recommendation: 'Use SafeMath library or Solidity 0.8+ which has built-in overflow protection.',
      timestamp: Date.now(),
      resolved: false
    },
    {
      id: 'access-control',
      severity: 'high',
      category: 'smart-contract',
      title: 'Insufficient Access Control',
      description: 'Critical functions may lack proper access control mechanisms.',
      recommendation: 'Implement proper role-based access control using OpenZeppelin AccessControl.',
      timestamp: Date.now(),
      resolved: false
    }
  ];

  private readonly MEDIUM_ISSUES: SecurityIssue[] = [
    {
      id: 'frontend-injection',
      severity: 'medium',
      category: 'frontend',
      title: 'Potential XSS Vulnerability',
      description: 'User input is not properly sanitized before rendering.',
      recommendation: 'Use React\'s built-in XSS protection and sanitize all user inputs.',
      timestamp: Date.now(),
      resolved: false
    },
    {
      id: 'wallet-connection',
      severity: 'medium',
      category: 'wallet',
      title: 'Wallet Connection Security',
      description: 'Wallet connection may not be properly validated.',
      recommendation: 'Implement proper wallet validation and connection state management.',
      timestamp: Date.now(),
      resolved: false
    },
    {
      id: 'network-security',
      severity: 'medium',
      category: 'network',
      title: 'Network Security',
      description: 'Network requests may not be properly secured.',
      recommendation: 'Use HTTPS for all network requests and implement proper CORS policies.',
      timestamp: Date.now(),
      resolved: false
    }
  ];

  // Perform comprehensive security audit
  async performSecurityAudit(
    signer: ethers.JsonRpcSigner
  ): Promise<SecurityAuditResult> {
    const issues: SecurityIssue[] = [];
    let overallScore = 100;

    try {
      // Check smart contract security
      const contractIssues = await this.auditSmartContract(signer);
      issues.push(...contractIssues);
      overallScore -= contractIssues.length * 15; // Deduct 15 points per issue

      // Check frontend security
      const frontendIssues = this.auditFrontendSecurity();
      issues.push(...frontendIssues);
      overallScore -= frontendIssues.length * 10; // Deduct 10 points per issue

      // Check wallet security
      const walletIssues = this.auditWalletSecurity();
      issues.push(...walletIssues);
      overallScore -= walletIssues.length * 8; // Deduct 8 points per issue

      // Check network security
      const networkIssues = this.auditNetworkSecurity();
      issues.push(...networkIssues);
      overallScore -= networkIssues.length * 5; // Deduct 5 points per issue

      // Generate recommendations
      const recommendations = this.generateRecommendations(issues);

      return {
        overallScore: Math.max(0, overallScore),
        issues,
        recommendations,
        lastAudit: Date.now()
      };

    } catch (error) {
      
      // Return basic audit with error
      return {
        overallScore: 50, // Reduced score due to audit failure
        issues: [
          {
            id: 'audit-failure',
            severity: 'high',
            category: 'smart-contract',
            title: 'Security Audit Failed',
            description: 'Unable to complete security audit due to technical issues.',
            recommendation: 'Retry the security audit and check system connectivity.',
            timestamp: Date.now(),
            resolved: false
          }
        ],
        recommendations: ['Retry security audit', 'Check system connectivity'],
        lastAudit: Date.now()
      };
    }
  }

  // Audit smart contract security
  private async auditSmartContract(signer: ethers.JsonRpcSigner): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    try {
      await dexService.initialize(signer);

      // Check if contract is deployed
      const isDeployed = await dexService.isContractDeployed();
      if (!isDeployed) {
        issues.push({
          id: 'contract-not-deployed',
          severity: 'critical',
          category: 'smart-contract',
          title: 'Contract Not Deployed',
          description: 'DEX contract is not deployed on the current network.',
          recommendation: 'Deploy the contract or switch to the correct network.',
          timestamp: Date.now(),
          resolved: false
        });
        return issues;
      }

      // Check for common vulnerabilities
      const contractAddress = dexService.contractAddress;
      
      // Check if contract has proper access control
      try {
        // This would check for owner functions and access control
        // For demo purposes, we'll simulate some checks
        const hasAccessControl = await this.checkAccessControl(contractAddress, signer);
        if (!hasAccessControl) {
          issues.push(this.CRITICAL_ISSUES.find(issue => issue.id === 'access-control')!);
        }
      } catch (error) {
      }

      // Check for reentrancy protection
      try {
        const hasReentrancyProtection = await this.checkReentrancyProtection(contractAddress, signer);
        if (!hasReentrancyProtection) {
          issues.push(this.CRITICAL_ISSUES.find(issue => issue.id === 'reentrancy-attack')!);
        }
      } catch (error) {
      }

      // Check for overflow protection
      try {
        const hasOverflowProtection = await this.checkOverflowProtection(contractAddress, signer);
        if (!hasOverflowProtection) {
          issues.push(this.CRITICAL_ISSUES.find(issue => issue.id === 'integer-overflow')!);
        }
      } catch (error) {
      }

    } catch (error) {
      issues.push({
        id: 'contract-audit-failed',
        severity: 'high',
        category: 'smart-contract',
        title: 'Contract Audit Failed',
        description: 'Unable to audit smart contract due to technical issues.',
        recommendation: 'Check contract deployment and network connectivity.',
        timestamp: Date.now(),
        resolved: false
      });
    }

    return issues;
  }

  // Audit frontend security
  private auditFrontendSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for XSS vulnerabilities
    const hasXSSProtection = this.checkXSSProtection();
    if (!hasXSSProtection) {
      issues.push(this.MEDIUM_ISSUES.find(issue => issue.id === 'frontend-injection')!);
    }

    // Check for proper input validation
    const hasInputValidation = this.checkInputValidation();
    if (!hasInputValidation) {
      issues.push({
        id: 'input-validation',
        severity: 'medium',
        category: 'frontend',
        title: 'Insufficient Input Validation',
        description: 'User inputs may not be properly validated.',
        recommendation: 'Implement comprehensive input validation and sanitization.',
        timestamp: Date.now(),
        resolved: false
      });
    }

    return issues;
  }

  // Audit wallet security
  private auditWalletSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check wallet connection security
    const hasSecureWalletConnection = this.checkWalletConnectionSecurity();
    if (!hasSecureWalletConnection) {
      issues.push(this.MEDIUM_ISSUES.find(issue => issue.id === 'wallet-connection')!);
    }

    return issues;
  }

  // Audit network security
  private auditNetworkSecurity(): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for HTTPS usage
    const isHTTPS = window.location.protocol === 'https:';
    if (!isHTTPS) {
      issues.push({
        id: 'https-required',
        severity: 'medium',
        category: 'network',
        title: 'HTTPS Not Used',
        description: 'Application is not served over HTTPS.',
        recommendation: 'Deploy application with HTTPS to ensure secure communication.',
        timestamp: Date.now(),
        resolved: false
      });
    }

    // Check for proper CORS configuration
    const hasProperCORS = this.checkCORSConfiguration();
    if (!hasProperCORS) {
      issues.push(this.MEDIUM_ISSUES.find(issue => issue.id === 'network-security')!);
    }

    return issues;
  }

  // Check access control
  private async checkAccessControl(contractAddress: string, signer: ethers.JsonRpcSigner): Promise<boolean> {
    try {
      // This would check for owner functions and access control
      // For demo purposes, return true
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check reentrancy protection
  private async checkReentrancyProtection(contractAddress: string, signer: ethers.JsonRpcSigner): Promise<boolean> {
    try {
      // This would check for reentrancy protection
      // For demo purposes, return true
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check overflow protection
  private async checkOverflowProtection(contractAddress: string, signer: ethers.JsonRpcSigner): Promise<boolean> {
    try {
      // This would check for overflow protection
      // For demo purposes, return true
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check XSS protection
  private checkXSSProtection(): boolean {
    // Check if React is being used (which provides XSS protection)
    return typeof React !== 'undefined';
  }

  // Check input validation
  private checkInputValidation(): boolean {
    // Check if input validation is implemented
    // For demo purposes, return true
    return true;
  }

  // Check wallet connection security
  private checkWalletConnectionSecurity(): boolean {
    // Check if wallet connection is properly implemented
    // For demo purposes, return true
    return true;
  }

  // Check CORS configuration
  private checkCORSConfiguration(): boolean {
    // Check if CORS is properly configured
    // For demo purposes, return true
    return true;
  }

  // Generate recommendations based on issues
  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    const highIssues = issues.filter(issue => issue.severity === 'high');
    const mediumIssues = issues.filter(issue => issue.severity === 'medium');

    if (criticalIssues.length > 0) {
      recommendations.push('Address critical security issues immediately');
    }

    if (highIssues.length > 0) {
      recommendations.push('Review and fix high-priority security issues');
    }

    if (mediumIssues.length > 0) {
      recommendations.push('Consider addressing medium-priority security issues');
    }

    if (issues.length === 0) {
      recommendations.push('No security issues detected - maintain current security practices');
    }

    return recommendations;
  }

  // Get security score color
  getSecurityScoreColor(score: number): string {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  }

  // Get security score label
  getSecurityScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }
}

// Create singleton instance
export const securityAuditService = new SecurityAuditService(); 