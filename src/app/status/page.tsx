
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Server, Database, Zap, Globe } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  description: string;
  icon: React.ReactNode;
}

export default function StatusPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Chat Service',
      status: 'operational',
      description: 'AI chat functionality is working normally',
      icon: <Zap className="h-4 w-4" />
    },
    {
      name: 'Database',
      status: 'operational', 
      description: 'Supabase database is connected and responsive',
      icon: <Database className="h-4 w-4" />
    },
    {
      name: 'API Gateway',
      status: 'operational',
      description: 'All API endpoints are responding normally',
      icon: <Server className="h-4 w-4" />
    },
    {
      name: 'Web Interface',
      status: 'operational',
      description: 'Website is loading and functioning properly',
      icon: <Globe className="h-4 w-4" />
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'outage': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Operational';
      case 'degraded': return 'Degraded Performance';
      case 'outage': return 'Outage';
      default: return 'Unknown';
    }
  };

  const overallStatus = services.every(s => s.status === 'operational') 
    ? 'All Systems Operational' 
    : services.some(s => s.status === 'outage')
    ? 'Some Systems Down'
    : 'Degraded Performance';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="text-inherit hover:bg-accent/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">System Status</h1>
            <p className="text-muted-foreground">Current status of all services</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(services.every(s => s.status === 'operational') ? 'operational' : 'degraded')}`}></div>
              Overall Status
            </CardTitle>
            <CardDescription>{overallStatus}</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4">
          {services.map((service, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {service.icon}
                    {service.name}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(service.status)} text-white border-none`}
                  >
                    {getStatusText(service.status)}
                  </Badge>
                </CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Latest system updates and maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-2 border-green-500 pl-4">
                <p className="font-medium">All systems operational</p>
                <p className="text-sm text-muted-foreground">System is running smoothly</p>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
