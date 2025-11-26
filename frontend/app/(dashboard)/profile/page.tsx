'use client';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user } = useAuth();
  
  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 min-h-screen">
      <Header title="Profile" showSearch={false} />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6 min-h-[calc(100vh-80px)]">
        {/* Profile Header Card */}
        <Card className="rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24 text-2xl">
                <AvatarFallback className="bg-[#4169E1] text-white text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {user?.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {user?.email}
                </p>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                  Active Member
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card className="rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-xl dark:text-white">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {/* Full Name */}
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mt-0.5">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {user?.name}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 mt-0.5">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 mt-0.5">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : format(new Date(), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}