# 📱 Edge Functions App Integration Test Guide

## 🎯 **Test Overview**

This guide helps you test the Edge Functions integration in the React Native app.

## 🚀 **Setup Instructions**

### 1. **Start the Development Server**
```bash
cd "d:\Cfiles\MUGISHA\Desktop\poultry\PoultryCure"
npm start
# or
expo start
```

### 2. **Run on Device/Simulator**
- **iOS**: Press `i` in terminal or scan QR code with Expo Go
- **Android**: Press `a` in terminal or scan QR code with Expo Go
- **Web**: Press `w` in terminal

## 🧪 **Test Scenarios**

### **Scenario 1: Edge Function Test Tab**
1. **Navigate to Edge Test Tab**
   - Look for the ⚡ "Edge Test" tab in the bottom navigation
   - Should show "🧪 Edge Function Test" header

2. **Test System Status**
   - Check connection status (should show 🟢 Online)
   - Verify usage info shows current requests
   - Confirm "Can Request" shows ✅ Yes

3. **Test AI Diagnosis**
   - Enter symptoms: "chicken has respiratory symptoms and sneezing"
   - Tap "🤖 Test AI Diagnosis"
   - Should show success alert with diagnosis details
   - Check response time (should be under 5 seconds)

4. **Test Rate Limiting**
   - Tap "⚡ Rate Limit Test"
   - Should complete 3 rapid requests
   - Check usage count increases

### **Scenario 2: Symptom Input Integration**
1. **Navigate to Diagnosis**
   - Go to Home tab
   - Tap "Start Diagnosis" or navigate to `/diagnosis/symptom-input`

2. **Test Edge Function Integration**
   - Enter symptoms: "Bird is coughing, has watery eyes, and loss of appetite for 2 days"
   - Tap "Analyze Symptoms"
   - Should show success alert with:
     - Disease name
     - Confidence percentage
     - Option to view details

3. **Verify Diagnosis History**
   - Go to History tab
   - Should see new diagnosis from edge function
   - Check diagnosis details include AI-generated content

### **Scenario 3: Error Handling**
1. **Test Network Issues**
   - Turn off internet/wifi
   - Try edge function test
   - Should show appropriate error message

2. **Test Invalid Input**
   - Enter empty symptoms
   - Should show validation error
   - Enter very short symptoms
   - Should show minimum length error

## 🔍 **Expected Results**

### ✅ **Success Indicators**
- **Edge Test Tab**: Shows green online status, successful AI diagnosis
- **Symptom Input**: Completes analysis with edge function, shows success alert
- **History Tab**: New diagnoses appear with AI-generated content
- **Usage Tracking**: Request count increases after each test

### ❌ **Error Indicators**
- **Network Errors**: Clear error messages about connectivity
- **API Errors**: Graceful fallback to mock responses
- **Validation**: Proper input validation before API calls

## 🛠️ **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Edge Function Not Working**
- **Symptoms**: Tests fail, network errors
- **Solutions**:
  - Check Supabase functions are deployed: `npx supabase functions list`
  - Verify environment variables: `npx supabase secrets list`
  - Check function logs in Supabase Dashboard

#### **2. Gemini API Issues**
- **Symptoms**: API errors, fallback responses
- **Solutions**:
  - Verify API key is valid
  - Check Gemini API quota
  - Review function logs for specific errors

#### **3. App Connection Issues**
- **Symptoms**: Can't connect, timeout errors
- **Solutions**:
  - Check internet connection
  - Verify Supabase URL in .env file
  - Restart development server

#### **4. Navigation Issues**
- **Symptoms**: Can't find Edge Test tab
- **Solutions**:
  - Restart the app
  - Clear Expo cache: `expo start -c`
  - Check for navigation errors in console

## 📊 **Performance Metrics**

### **Expected Performance**
- **AI Diagnosis Response**: < 5 seconds
- **Health Check**: < 2 seconds
- **Rate Limiting**: Instant response
- **App Navigation**: Smooth transitions

### **Monitor These Metrics**
1. **Response Times**: Should be consistent
2. **Success Rates**: Should be > 95%
3. **Error Rates**: Should be < 5%
4. **Usage Tracking**: Should increment correctly

## 🔧 **Debug Tools**

### **Console Logs**
- Check Expo development server logs
- Look for edge function responses
- Monitor network requests

### **Supabase Dashboard**
- **Functions Tab**: View deployed functions and logs
- **Logs Tab**: Check function execution logs
- **Settings**: Verify environment variables

### **Network Inspector**
- Use React Native debugger
- Monitor API calls to edge functions
- Check request/response payloads

## 📝 **Test Checklist**

### **Before Testing**
- [ ] Edge functions deployed successfully
- [ ] Environment variables configured
- [ ] App running on device/simulator
- [ ] User authenticated in app

### **During Testing**
- [ ] Edge Test tab loads correctly
- [ ] System status shows online
- [ ] AI diagnosis completes successfully
- [ ] Rate limiting works properly
- [ ] Error handling shows appropriate messages
- [ ] Diagnosis history updates correctly

### **After Testing**
- [ ] All test scenarios completed
- [ ] No unexpected errors in logs
- [ ] Performance metrics within expected ranges
- [ ] User experience is smooth and intuitive

## 🎉 **Success Criteria**

The integration is successful when:
1. ✅ Edge functions respond correctly from the app
2. ✅ AI diagnosis works with real Gemini API
3. ✅ Rate limiting prevents abuse
4. ✅ Error handling is graceful
5. ✅ User experience is seamless
6. ✅ Performance is acceptable

## 📞 **Support**

If you encounter issues:
1. Check this guide first
2. Review console logs
3. Check Supabase Dashboard
4. Verify environment variables
5. Restart development server

---

**Ready to test! 🚀**
