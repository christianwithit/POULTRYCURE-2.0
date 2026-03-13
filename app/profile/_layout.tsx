import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="edit" 
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen 
        name="change-password" 
        options={{
          title: 'Change Password',
        }}
      />
      <Stack.Screen 
        name="about" 
        options={{
          title: 'About PoultryCure',
        }}
      />
      <Stack.Screen 
        name="help" 
        options={{
          title: 'Help & Support',
        }}
      />
      <Stack.Screen 
        name="terms" 
        options={{
          title: 'Terms & Privacy',
        }}
      />
      <Stack.Screen 
        name="bookmarks" 
        options={{
          title: 'Bookmarked Diseases',
        }}
      />
      <Stack.Screen 
        name="cache-settings" 
        options={{
          title: 'Offline & Cache',
        }}
      />
    </Stack>
  );
}