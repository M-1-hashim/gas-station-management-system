; ============================================================
; Gas Station Manager - NSIS Installer Script
; سیستم مدیریت تانک تیل - نصب‌کننده
; ============================================================

!define APP_NAME "Gas Station Manager"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "Gas Station Manager"
!define APP_URL "https://github.com/M-1-hashim/gas-station-management-system"
!define APP_EXE "Start-GasStationManager.bat"
!define APP_DIRNAME "GasStationManager"

; Include Modern UI
!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "FileFunc.nsh"

; General
Name "${APP_NAME}"
OutFile "GasStationManager-Setup.exe"
Unicode True
ShowInstDetails show
ShowUnInstDetails show

; Version Info
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey "FileDescription" "Offline Gas Station Management System"

; Folder selection page
InstallDir "$PROGRAMFILES64\${APP_DIRNAME}"
RequestExecutionLevel admin

; Remember install dir
InstallDirRegKey HKCU "Software\${APP_NAME}" ""

; Interface Settings
!define MUI_ABORTWARNING

; Welcome page
!define MUI_WELCOMEPAGE_TITLE "Gas Station Manager - ${APP_VERSION}"
!define MUI_WELCOMEPAGE_TEXT "This will install Gas Station Manager (سیستم مدیریت تانک تیل) on your computer.$\r$\n$\r$\nAn offline gas station management system with Dari, Pashto, and English support.$\r$\n$\r$\nPrerequisite: Node.js must be installed (download from nodejs.org)$\r$\n$\r$\nClick Next to continue."
!insertmacro MUI_PAGE_WELCOME

; License page (skip - no license)
; Directory page
!insertmacro MUI_PAGE_DIRECTORY

; Components page
!insertmacro MUI_PAGE_COMPONENTS

; Instfiles page
!insertmacro MUI_PAGE_INSTFILES

; Finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Start Gas Station Manager now"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README-INSTALL.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "View installation guide"
!define MUI_FINISHPAGE_LINK "Visit project on GitHub"
!define MUI_FINISHPAGE_LINK_LOCATION "${APP_URL}"
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Language
!insertmacro MUI_LANGUAGE "English"

; ============================================================
; Installer Sections
; ============================================================

Section "Application Files" SecApp
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; Copy all files from portable package
  File /r "GasStationManager-Portable\*.*"
  
  ; Write registry keys
  WriteRegStr HKCU "Software\${APP_NAME}" "" $INSTDIR
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\${APP_EXE}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "URLInfoAbout" "${APP_URL}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
  
  ; Estimate install size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "EstimatedSize" "$0"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  ; Run shortcut installer
  ExecWait '"$INSTDIR\Install-Shortcuts.bat"'
  
SectionEnd

; ============================================================
; Descriptions
; ============================================================

LangString DESC_SecApp ${LANG_ENGLISH} "Install Gas Station Manager application files (required)"
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${SecApp} $(DESC_SecApp)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ============================================================
; Uninstaller
; ============================================================

Section "Uninstall"
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
  DeleteRegKey HKCU "Software\${APP_NAME}"
  
  ; Remove shortcuts
  Delete "$DESKTOP\Gas Station Manager.lnk"
  RMDir /r "$SMPROGRAMS\Gas Station Manager"
  
  ; Remove files
  RMDir /r "$INSTDIR"
  
  ; Show completion
  MessageBox MB_ICONINFORMATION|MB_OK "${APP_NAME} has been successfully uninstalled."
SectionEnd
