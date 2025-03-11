import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
  Card,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Button,
  Input,
  Textarea,
  Switch,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  EnvelopeIcon,
  CloudArrowUpIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";

export default function Settings({ auth, settings, error, success }) {
  const [activeTab, setActiveTab] = useState("general");
  const { data, setData, post, processing } = useForm({
    siteName: settings?.siteName || "",
    siteDescription: settings?.siteDescription || "",
    maintenanceMode: settings?.maintenanceMode || false,
    allowRegistration: settings?.allowRegistration || true,
    emailNotifications: settings?.emailNotifications || true,
    backupFrequency: settings?.backupFrequency || "daily",
    maxFileSize: settings?.maxFileSize || "10",
    defaultUserRole: settings?.defaultUserRole || "user",
    sessionTimeout: settings?.sessionTimeout || "120",
    smtpHost: settings?.smtpHost || "",
    smtpPort: settings?.smtpPort || "",
    smtpUser: settings?.smtpUser || "",
    smtpPassword: settings?.smtpPassword || "",
    smtpEncryption: settings?.smtpEncryption || "tls",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("admin.settings.update"));
  };

  const tabs = [
    {
      label: "General",
      value: "general",
      icon: Cog6ToothIcon,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardBody className="p-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Site Settings
              </Typography>
              <div className="space-y-4">
                <Input
                  type="text"
                  label="Site Name"
                  value={data.siteName}
                  onChange={(e) => setData("siteName", e.target.value)}
                />
                <Textarea
                  label="Site Description"
                  value={data.siteDescription}
                  onChange={(e) => setData("siteDescription", e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <Typography color="gray">Maintenance Mode</Typography>
                  <Switch
                    checked={data.maintenanceMode}
                    onChange={(e) => setData("maintenanceMode", e.target.checked)}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Registration & Access
              </Typography>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Typography color="gray">Allow Registration</Typography>
                  <Switch
                    checked={data.allowRegistration}
                    onChange={(e) => setData("allowRegistration", e.target.checked)}
                  />
                </div>
                <Select
                  label="Default User Role"
                  value={data.defaultUserRole}
                  onChange={(value) => setData("defaultUserRole", value)}
                >
                  <Option value="user">User</Option>
                  <Option value="editor">Editor</Option>
                </Select>
                <Input
                  type="number"
                  label="Session Timeout (minutes)"
                  value={data.sessionTimeout}
                  onChange={(e) => setData("sessionTimeout", e.target.value)}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      ),
    },
    {
      label: "Security",
      value: "security",
      icon: ShieldCheckIcon,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardBody className="p-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Password Policy
              </Typography>
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Minimum Password Length"
                  value={data.minPasswordLength}
                  onChange={(e) => setData("minPasswordLength", e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <Typography color="gray">Require Special Characters</Typography>
                  <Switch
                    checked={data.requireSpecialChars}
                    onChange={(e) => setData("requireSpecialChars", e.target.checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Typography color="gray">Require Numbers</Typography>
                  <Switch
                    checked={data.requireNumbers}
                    onChange={(e) => setData("requireNumbers", e.target.checked)}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-6">
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Two-Factor Authentication
              </Typography>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Typography color="gray">Enable 2FA</Typography>
                  <Switch
                    checked={data.enable2FA}
                    onChange={(e) => setData("enable2FA", e.target.checked)}
                  />
                </div>
                <Select
                  label="2FA Method"
                  value={data.twoFactorMethod}
                  onChange={(value) => setData("twoFactorMethod", value)}
                >
                  <Option value="email">Email</Option>
                  <Option value="authenticator">Authenticator App</Option>
                  <Option value="sms">SMS</Option>
                </Select>
              </div>
            </CardBody>
          </Card>
        </div>
      ),
    },
    {
      label: "Notifications",
      value: "notifications",
      icon: BellIcon,
      content: (
        <Card>
          <CardBody className="p-6">
            <Typography variant="h6" color="blue-gray" className="mb-4">
              Email Notifications
            </Typography>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Typography color="gray">Enable Email Notifications</Typography>
                <Switch
                  checked={data.emailNotifications}
                  onChange={(e) => setData("emailNotifications", e.target.checked)}
                />
              </div>
              <Input
                type="text"
                label="SMTP Host"
                value={data.smtpHost}
                onChange={(e) => setData("smtpHost", e.target.value)}
              />
              <Input
                type="text"
                label="SMTP Port"
                value={data.smtpPort}
                onChange={(e) => setData("smtpPort", e.target.value)}
              />
              <Input
                type="text"
                label="SMTP Username"
                value={data.smtpUser}
                onChange={(e) => setData("smtpUser", e.target.value)}
              />
              <Input
                type="password"
                label="SMTP Password"
                value={data.smtpPassword}
                onChange={(e) => setData("smtpPassword", e.target.value)}
              />
              <Select
                label="Encryption"
                value={data.smtpEncryption}
                onChange={(value) => setData("smtpEncryption", value)}
              >
                <Option value="tls">TLS</Option>
                <Option value="ssl">SSL</Option>
                <Option value="none">None</Option>
              </Select>
            </div>
          </CardBody>
        </Card>
      ),
    },
    {
      label: "Backup",
      value: "backup",
      icon: CloudArrowUpIcon,
      content: (
        <Card>
          <CardBody className="p-6">
            <Typography variant="h6" color="blue-gray" className="mb-4">
              Backup Settings
            </Typography>
            <div className="space-y-4">
              <Select
                label="Backup Frequency"
                value={data.backupFrequency}
                onChange={(value) => setData("backupFrequency", value)}
              >
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
              </Select>
              <Input
                type="number"
                label="Maximum File Size (MB)"
                value={data.maxFileSize}
                onChange={(e) => setData("maxFileSize", e.target.value)}
              />
              <div className="flex items-center justify-between">
                <Typography color="gray">Enable Auto Backup</Typography>
                <Switch
                  checked={data.autoBackup}
                  onChange={(e) => setData("autoBackup", e.target.checked)}
                />
              </div>
              <Button
                variant="outlined"
                color="blue"
                className="flex items-center gap-2"
                onClick={() => post(route("admin.backup.create"))}
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                Create Backup Now
              </Button>
            </div>
          </CardBody>
        </Card>
      ),
    },
  ];

  return (
    <Authenticated user={auth.user}>
      <Head title="Admin Settings" />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h1>
                <p className="text-gray-600 max-w-2xl">
                  Configure system-wide settings and preferences for your 4G Network Tracking system.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          {/* Settings Tabs */}
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab}>
              <TabsHeader>
                {tabs.map(({ label, value, icon: Icon }) => (
                  <Tab key={value} value={value} onClick={() => setActiveTab(value)}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {label}
                    </div>
                  </Tab>
                ))}
              </TabsHeader>
              <TabsBody className="mt-6">
                {tabs.map(({ value, content }) => (
                  <TabPanel key={value} value={value}>
                    {content}
                  </TabPanel>
                ))}
              </TabsBody>
            </Tabs>

            {/* Submit Button */}
            <div className="mt-6">
              <Button
                type="submit"
                color="blue"
                className="flex items-center gap-2"
                disabled={processing}
              >
                <Cog6ToothIcon className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Authenticated>
  );
} 