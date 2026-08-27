; ============================================================
; Gas Station Manager - Desktop App Installer (No Browser Needed)
; ============================================================

!define APP_NAME "Gas Station Manager"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "Gas Station Manager"
!define APP_EXE "Gas Station Manager.exe"
!define APP_DIRNAME "GasStationManager"

!include "MUI2.nsh"
!include "FileFunc.nsh"

Name "${APP_NAME}"
OutFile "GasStationManager-Desktop-Setup.exe"
Unicode True
ShowInstDetails show
ShowUnInstDetails show

VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey "FileDescription" "Offline Gas Station Management System"
VIAddVersionKey "LegalCopyright" "Copyright 2026"

InstallDir "$PROGRAMFILES64\${APP_DIRNAME}"
RequestExecutionLevel admin
InstallDirRegKey HKCU "Software\${APP_NAME}" ""

!define MUI_ABORTWARNING

!define MUI_WELCOMEPAGE_TITLE "Gas Station Manager - ${APP_VERSION}"
!define MUI_WELCOMEPAGE_TEXT "This will install Gas Station Manager on your computer.$\r$\n$\r$\nA complete offline desktop application for gas station management.$\r$\nNo browser needed - runs as a native Windows app!$\r$\n$\r$\nFeatures:$\r$\n  - Sales, Tanks, Customers, Expenses management$\r$\n  - Dari, Pashto, English support$\r$\n  - Offline SQLite database$\r$\n  - Receipt printing$\r$\n  - Reports & analytics$\r$\n$\r$\nClick Next to continue."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Gas Station Manager now"
!define MUI_FINISHPAGE_LINK "Visit project on GitHub"
!define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/M-1-hashim/gas-station-management-system"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Application" SecApp
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; Copy all files from win-unpacked
  File /r "dist-electron\win-unpacked\*.*"
  
  ; Write registry keys for Add/Remove Programs
  WriteRegStr HKCU "Software\${APP_NAME}" "" $INSTDIR
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\${APP_EXE}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
  
  ; Calculate install size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "EstimatedSize" "$0"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  ; Create desktop shortcut
  CreateShortcut "$DESKTOP\Gas Station Manager.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0
  
  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\Gas Station Manager"
  CreateShortcut "$SMPROGRAMS\Gas Station Manager\Gas Station Manager.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0
  CreateShortcut "$SMPROGRAMS\Gas Station Manager\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
  
SectionEnd

Section "Uninstall"
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
  DeleteRegKey HKCU "Software\${APP_NAME}"
  
  ; Remove shortcuts
  Delete "$DESKTOP\Gas Station Manager.lnk"
  RMDir /r "$SMPROGRAMS\Gas Station Manager"
  
  ; Remove files
  RMDir /r "$INSTDIR"
  
  MessageBox MB_ICONINFORMATION|MB_OK "${APP_NAME} has been successfully uninstalled."
SectionEnd
