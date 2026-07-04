import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      sidebar: {
        dashboard: 'Dashboard',
        profiles: 'Profiles',
        settings: 'Settings',
        about: 'About',
        themeToggle: 'Toggle Theme'
      },
      dashboard: {
        title: 'Rune Launcher',
        subtitle: 'Isolated process loader pipeline & multi-client coordinator',
        profileDependencies: 'Profile Dependencies',
        dependenciesDesc: 'Active mods and client DLL dependencies for this profile',
        externalClient: 'External Client (Step 2 DLLs)',
        installedMods: 'Installed Mods',
        activeInject: 'Active Inject Target',
        ready: 'Ready',
        noDlls: 'No custom client DLLs loaded.',
        noMods: 'No mods installed in this profile.',
        importMod: 'Import Mod',
        chooseDll: 'Choose DLL or Package',
        resolvesDeps: 'Resolves dependencies dynamically',
        manageContents: 'Manage Contents',
        contentsDesc: 'Customize Worlds, Textures, and Skinpacks for this profile (Simulated UI)',
        worlds: 'Worlds',
        textures: 'Textures',
        skinpacks: 'Skinpacks',
        world: 'World',
        texture: 'Texture',
        skinpack: 'Skinpack',
        noInstalled: 'No {{type}} installed.',
        addMock: 'Add Mock {{type}}',
        launchButton: 'Launch',
        scanningProcess: 'SCANNING PROCESS...',
        waitingLaunch: 'Waiting for game launch... The launcher will automatically inject when Minecraft.Windows.exe is detected.',
        injectSuccess: 'DLL injection successful! Launcher features have been loaded.',
        launchFailed: 'Failed to launch the game. Please check the logs for details.',
        createProfile: 'Create Profile',
        createProfileDesc: 'Enter a name for the new modding environment.',
        profilePlaceholder: 'e.g. Modded-1.20',
        cancel: 'Cancel',
        create: 'Create',
        updateAvailable: 'Update Available',
        updateDesc: 'A new version of Rune Launcher is ready to download.',
        remindLater: 'Remind Later',
        updateNow: 'Update Now'
      },
      settings: {
        title: 'Settings',
        desc: 'Configure launcher update settings and application preferences.',
        appVersion: 'App Version',
        appVersionDesc: 'Current installed version of Rune Launcher',
        updateChannel: 'Update Channel',
        updateChannelDesc: 'Choose between stable releases or experimental beta builds',
        checkUpdates: 'Check for Updates',
        checkUpdatesDesc: 'Manually query GitHub for new update payloads',
        checkNow: 'Check Now',
        checking: 'Checking...',
        stable: 'Stable (Recommended)',
        beta: 'Beta (Experimental)',
        language: 'Language',
        languageDesc: 'Choose your preferred display language'
      },
      about: {
        title: 'About',
        subtitle: 'Developer credits, license terms, and repository metadata.',
        author: 'Developer Credits',
        repoLink: 'Visit Repository',
        tech: 'Technology Stack',
        techDesc: 'Core technologies driving the isolated coordination engine'
      },
      profiles: {
        title: 'Profile Customizer',
        desc: 'Manage load sequences, toggle mods, and remove dependencies for the active profile.',
        modsHeader: 'Mod Packages (Step 3 DLLs)',
        externalsHeader: 'External DLL Dependencies (Step 2 DLLs)',
        noMods: 'No mod packages found in this profile.',
        noExternals: 'No external DLLs found in this profile.',
        deleteTitle: 'Confirm Deletion',
        deleteDesc: 'Are you sure you want to delete "{{name}}"? This action will permanently remove the files from disk.',
        deleteButton: 'Delete',
        moveUp: 'Move Up',
        moveDown: 'Move Down'
      }
    }
  },
  ja: {
    translation: {
      sidebar: {
        dashboard: 'ダッシュボード',
        profiles: 'プロファイル',
        settings: '設定',
        about: 'アバウト',
        themeToggle: 'テーマ切り替え'
      },
      dashboard: {
        title: 'Rune Launcher',
        subtitle: '隔離プロセスローダーパイプライン ＆ マルチクライアントコーディネーター',
        profileDependencies: 'プロファイルの依存関係',
        dependenciesDesc: 'このプロファイルでアクティブなModとクライアントDLLの依存関係',
        externalClient: '外部クライアント (Step 2 DLL)',
        installedMods: 'インストール済みMod',
        activeInject: 'インジェクション対象',
        ready: '準備完了',
        noDlls: 'カスタムクライアントDLLが読み込まれていません。',
        noMods: 'このプロファイルにインストールされているModはありません。',
        importMod: 'Modをインポート',
        chooseDll: 'DLLまたはパッケージを選択',
        resolvesDeps: '依存関係を動的に解決します',
        manageContents: 'コンテンツ管理',
        contentsDesc: 'このプロファイルのワールド、テクスチャ、スキンパックをカスタマイズ (シミュレーションUI)',
        worlds: 'ワールド',
        textures: 'テクスチャ',
        skinpacks: 'スキンパック',
        world: 'ワールド',
        texture: 'テクスチャ',
        skinpack: 'スキンパック',
        noInstalled: 'インストールされている{{type}}はありません。',
        addMock: '模擬の{{type}}を追加',
        launchButton: '起動',
        scanningProcess: 'プロセススキャン中...',
        waitingLaunch: 'ゲームの起動を待機中... Minecraft.Windows.exe が検出されると、ランチャーが自動的にインジェクトします。',
        injectSuccess: 'DLLのインジェクションに成功しました！ランチャー機能がロードされました。',
        launchFailed: 'ゲームの起動に失敗しました。詳細はログを確認してください。',
        createProfile: 'プロファイル作成',
        createProfileDesc: '新しいモッディング環境の名前を入力してください。',
        profilePlaceholder: '例: Modded-1.20',
        cancel: 'キャンセル',
        create: '作成',
        updateAvailable: 'アップデートが利用可能です',
        updateDesc: '新しいバージョンの Rune Launcher をダウンロードする準備ができました。',
        remindLater: '後で通知',
        updateNow: '今すぐ更新'
      },
      settings: {
        title: '設定',
        desc: 'ランチャーのアップデート設定とアプリケーションの優先設定を構成します。',
        appVersion: 'アプリのバージョン',
        appVersionDesc: '現在インストールされている Rune Launcher のバージョン',
        updateChannel: 'アップデートチャンネル',
        updateChannelDesc: '安定版リリースか実験的なベータビルドかを選択します',
        checkUpdates: 'アップデートを確認',
        checkUpdatesDesc: '新しいアップデートパッケージをGitHubで手動クエリします',
        checkNow: '今すぐ確認',
        checking: '確認中...',
        stable: '安定版 (推奨)',
        beta: 'ベータ版 (実験的)',
        language: '表示言語',
        languageDesc: '優先する表示言語を選択します'
      },
      about: {
        title: 'アバウト',
        subtitle: '開発者情報、ライセンス条項、およびリポジトリのメタデータ。',
        author: '開発スタッフ',
        repoLink: 'リポジトリを開く',
        tech: '使用技術',
        techDesc: '隔離型プロセスローダーを支える技術スタック'
      },
      profiles: {
        title: 'プロファイルカスタマイザー',
        desc: 'アクティブなプロファイルのロード順序の管理、Modの切り替え、依存関係の削除を行います。',
        modsHeader: 'Modパッケージ (Step 3 DLL)',
        externalsHeader: '外部DLL依存関係 (Step 2 DLL)',
        noMods: 'このプロファイルにはModパッケージがありません。',
        noExternals: 'このプロファイルには外部DLLが見つかりません。',
        deleteTitle: '削除の確認',
        deleteDesc: '本当に「{{name}}」を削除しますか？この操作により、ディスクからファイルが完全に削除されます。',
        deleteButton: '削除',
        moveUp: '上へ移動',
        moveDown: '下へ移動'
      }
    }
  }
};

const savedLang = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
