
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, Copy, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TwoFactorAuth: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodesCopied, setRecoveryCodesCopied] = useState(false);
  
  const secretKey = "ABCDEFGHIJKLMNOP"; // This would be generated on the server
  const recoveryKeys = [
    "A1B2-C3D4-E5F6",
    "G7H8-I9J0-K1L2",
    "M3N4-O5P6-Q7R8",
    "S9T0-U1V2-W3X4",
    "Y5Z6-A7B8-C9D0"
  ];
  
  const handleToggle2FA = (checked: boolean) => {
    if (checked && !is2FAEnabled) {
      setShowSetup(true);
    } else if (!checked && is2FAEnabled) {
      // This would normally verify the user's identity before disabling
      toast.warning("Two-factor authentication has been disabled. Your account is now less secure.");
      setIs2FAEnabled(false);
    }
  };
  
  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }
    
    // In a real app, this would verify the code with the server
    toast.success("Two-factor authentication successfully enabled");
    setIs2FAEnabled(true);
    setShowSetup(false);
  };
  
  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryKeys.join("\n"));
    setRecoveryCodesCopied(true);
    toast.info("Recovery codes copied to clipboard");
  };
  
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-lg">
      <CardHeader>
        <div className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-blue-400" />
          <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showSetup ? (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-slate-200">
                {is2FAEnabled ? "Enabled" : "Disabled"}
              </div>
              <div className="text-xs text-slate-400">
                {is2FAEnabled 
                  ? "Your account is protected with two-factor authentication." 
                  : "We recommend enabling 2FA for additional security."}
              </div>
            </div>
            <Switch 
              checked={is2FAEnabled} 
              onCheckedChange={handleToggle2FA} 
              className={is2FAEnabled ? "bg-green-500" : ""}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-white mb-2">Setup Instructions</h3>
              <ol className="space-y-2 text-sm text-slate-300">
                <li>1. Download an authenticator app like Google Authenticator or Authy</li>
                <li>2. Scan the QR code or enter the setup key manually</li>
                <li>3. Enter the 6-digit code from the app</li>
              </ol>
              
              <div className="my-4 p-4 bg-slate-700 rounded text-center">
                <div className="text-xs text-slate-300 mb-2">QR Code would appear here</div>
                <div className="text-xs font-mono bg-slate-800 p-2 rounded text-white">
                  Secret key: {secretKey}
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="verification-code" className="text-white">Verification Code</Label>
                <Input 
                  id="verification-code" 
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Enter 6-digit code" 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <Label className="text-white">Recovery Codes</Label>
                <div className="p-2 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300">
                  {recoveryKeys.map((key, index) => (
                    <div key={index} className="py-1">{key}</div>
                  ))}
                </div>
                <div className="flex items-center text-xs text-yellow-400">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Save these codes in a secure place. They're needed if you lose access to your device.
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-slate-700 text-slate-300"
                  onClick={copyRecoveryCodes}
                >
                  {recoveryCodesCopied ? (
                    <>
                      <CheckCircle className="mr-1 h-4 w-4 text-green-400" /> 
                      Codes Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-4 w-4" /> 
                      Copy Recovery Codes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {showSetup && (
        <CardFooter className="border-t border-slate-800 pt-4">
          <div className="flex justify-between w-full">
            <Button 
              variant="ghost" 
              onClick={() => setShowSetup(false)}
              className="text-slate-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 6}
            >
              Verify and Enable
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default TwoFactorAuth;
