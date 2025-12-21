/**
 * User Lead Form Page
 * Multi-step form for collecting user information (public page)
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  personalInfoSchema,
  financialInfoSchema,
  type PersonalInfoInput,
  type FinancialInfoInput,
} from '@/lib/validation/lead.validation';

type FormStep = 1 | 2 | 3;

export default function UserFormPage() {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoInput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Section 1 form
  const personalForm = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      age: undefined,
    },
  });

  // Section 2 form
  const financialForm = useForm<FinancialInfoInput>({
    resolver: zodResolver(financialInfoSchema),
    defaultValues: {
      monthlyIncome: undefined,
      monthlyExpenses: undefined,
      familyExpenses: undefined,
      financialGoals: '',
      currentSavings: undefined,
      investmentExperience: undefined,
      riskTolerance: undefined,
      investmentHorizon: undefined,
    },
  });

  const handlePersonalSubmit = (data: PersonalInfoInput) => {
    setPersonalInfo(data);
    setCurrentStep(2);
  };

  const handleFinancialSubmit = async (data: FinancialInfoInput) => {
    if (!personalInfo) {
      toast.error('Please complete personal information first');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...personalInfo,
          ...data,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to submit form');
        return;
      }

      toast.success('Form submitted successfully!');
      setCurrentStep(3);
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setPersonalInfo(null);
    personalForm.reset();
    financialForm.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wealth Management</h1>
          <p className="mt-2 text-gray-600">
            Start your financial journey with us
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep >= 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Personal Info</span>
            </div>
            <div className="w-16 h-1 mx-4 bg-gray-200">
              <div
                className={`h-full transition-all ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                style={{ width: currentStep >= 2 ? '100%' : '0%' }}
              />
            </div>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep >= 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Financial Info</span>
            </div>
            <div className="w-16 h-1 mx-4 bg-gray-200">
              <div
                className={`h-full transition-all ${
                  currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                style={{ width: currentStep >= 3 ? '100%' : '0%' }}
              />
            </div>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep >= 3
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep >= 3 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '3'
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Complete</span>
            </div>
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    {...personalForm.register('fullName')}
                    placeholder="Enter your full name"
                  />
                  {personalForm.formState.errors.fullName && (
                    <p className="text-sm text-red-500">
                      {personalForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...personalForm.register('email')}
                    placeholder="Enter your email"
                  />
                  {personalForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {personalForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...personalForm.register('phone')}
                    placeholder="Enter your phone number"
                  />
                  {personalForm.formState.errors.phone && (
                    <p className="text-sm text-red-500">
                      {personalForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">
                    Age <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    {...personalForm.register('age', { valueAsNumber: true })}
                    placeholder="Enter your age"
                  />
                  {personalForm.formState.errors.age && (
                    <p className="text-sm text-red-500">
                      {personalForm.formState.errors.age.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">
                    Next
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Financial Information */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Help us understand your financial situation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={financialForm.handleSubmit(handleFinancialSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">
                      Monthly Income ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      step="0.01"
                      {...financialForm.register('monthlyIncome', { valueAsNumber: true })}
                      placeholder="e.g., 5000"
                    />
                    {financialForm.formState.errors.monthlyIncome && (
                      <p className="text-sm text-red-500">
                        {financialForm.formState.errors.monthlyIncome.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyExpenses">
                      Monthly Expenses ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="monthlyExpenses"
                      type="number"
                      step="0.01"
                      {...financialForm.register('monthlyExpenses', { valueAsNumber: true })}
                      placeholder="e.g., 3000"
                    />
                    {financialForm.formState.errors.monthlyExpenses && (
                      <p className="text-sm text-red-500">
                        {financialForm.formState.errors.monthlyExpenses.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="familyExpenses">
                      Family Expenses ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="familyExpenses"
                      type="number"
                      step="0.01"
                      {...financialForm.register('familyExpenses', { valueAsNumber: true })}
                      placeholder="e.g., 1500"
                    />
                    {financialForm.formState.errors.familyExpenses && (
                      <p className="text-sm text-red-500">
                        {financialForm.formState.errors.familyExpenses.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentSavings">
                      Current Savings ($)
                    </Label>
                    <Input
                      id="currentSavings"
                      type="number"
                      step="0.01"
                      {...financialForm.register('currentSavings', { valueAsNumber: true })}
                      placeholder="e.g., 10000"
                    />
                    {financialForm.formState.errors.currentSavings && (
                      <p className="text-sm text-red-500">
                        {financialForm.formState.errors.currentSavings.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financialGoals">
                    Financial Goals <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="financialGoals"
                    {...financialForm.register('financialGoals')}
                    placeholder="Describe your financial goals (e.g., retirement, buying a house, children's education)"
                    rows={4}
                  />
                  {financialForm.formState.errors.financialGoals && (
                    <p className="text-sm text-red-500">
                      {financialForm.formState.errors.financialGoals.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="investmentExperience">Investment Experience</Label>
                    <Select
                      onValueChange={(value) =>
                        financialForm.setValue(
                          'investmentExperience',
                          value as 'None' | 'Beginner' | 'Intermediate' | 'Advanced'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                    <Select
                      onValueChange={(value) =>
                        financialForm.setValue('riskTolerance', value as 'Low' | 'Medium' | 'High')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tolerance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investmentHorizon">Investment Horizon</Label>
                    <Select
                      onValueChange={(value) =>
                        financialForm.setValue(
                          'investmentHorizon',
                          value as 'Short-term' | 'Medium-term' | 'Long-term'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select horizon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Short-term">Short-term (1-3 years)</SelectItem>
                        <SelectItem value="Medium-term">Medium-term (3-7 years)</SelectItem>
                        <SelectItem value="Long-term">Long-term (7+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-600 mb-6">
                  Your information has been submitted successfully. Our team will review your
                  details and contact you soon.
                </p>
                <Button onClick={handleStartOver} variant="outline">
                  Submit Another Response
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
