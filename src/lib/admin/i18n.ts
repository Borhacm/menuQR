import { cookies, headers } from "next/headers";

export type AdminLocale = "en" | "es";

type AdminMessages = {
  nav: {
    dashboard: string;
    businessProfile: string;
    menus: string;
    items: string;
    templates: string;
    translations: string;
    qr: string;
    analytics: string;
    billing: string;
    team: string;
    settings: string;
  };
  sidebar: {
    activeOrganization: string;
    workspace: string;
    organizationUpdated: string;
    organizationSelector: string;
  };
  header: {
    switch: string;
    signOut: string;
    organizationSelector: string;
    language: string;
    languageEnglish: string;
    languageSpanish: string;
    saveLanguage: string;
    account: string;
    profile: string;
  };
  dashboard: {
    title: string;
    menus: string;
    items: string;
    events: string;
    workspace: string;
    organization: string;
    plan: string;
    checklistTitle: string;
    checklistDoneHint: string;
    checklistDismiss: string;
    open: string;
    checklist: {
      resourceConfigured: string;
      atLeastOneMenu: string;
      atLeastThreeItems: string;
      templateSelected: string;
      qrDesignSaved: string;
    };
  };
  resource: {
    title: string;
    noResource: string;
    brandDomain: string;
    whatIsResource: string;
    name: string;
    slug: string;
    defaultLocale: string;
    defaultCurrency: string;
    enabledLocales: string;
    enabledCurrencies: string;
    multiCurrencyPaidOnly: string;
    rootDomain: string;
    customDomain: string;
    customDomainPlaceholder: string;
    customDomainProOnly: string;
    save: string;
    saving: string;
    saveSuccess: string;
    saveError: string;
    saveErrorSlug: string;
  };
  menus: {
    title: string;
    createTitle: string;
    namePlaceholder: string;
    add: string;
    save: string;
    delete: string;
    deleteConfirm: string;
    existingTitle: string;
    categories: string;
    empty: string;
  };
  items: {
    title: string;
    createTitle: string;
    category: string;
    allergens: string;
    upgradeToUnlock: string;
    allergensPaidOnly: string;
    save: string;
    delete: string;
    deleteConfirm: string;
    currentTitle: string;
    optimizedImage: string;
    compatibleImage: string;
    noPhoto: string;
    featured: string;
    vegan: string;
    vegetarian: string;
    glutenFree: string;
    spicy: string;
    empty: string;
  };
  translations: {
    title: string;
    aiQueueTitle: string;
    aiQueueDescription: string;
    translateNow: string;
    recentTranslationsTitle: string;
    fieldName: string;
    fieldDescription: string;
    fieldPriceLabel: string;
    sourceAi: string;
    sourceManual: string;
    overridePlaceholder: string;
    override: string;
    empty: string;
  };
  qr: {
    title: string;
    designTitle: string;
    preview: string;
    dotsColor: string;
    backgroundColor: string;
    dotStyle: string;
    dotStyleSquare: string;
    dotStyleRounded: string;
    dotStyleDots: string;
    dotStyleHeart: string;
    cornerStyle: string;
    cornerStyleSquare: string;
    cornerStyleRounded: string;
    cornerStyleDot: string;
    cornerStyleHeart: string;
    icon: string;
    iconPresets: string;
    iconColor: string;
    noIcon: string;
    uploadIcon: string;
    iconUploadHelp: string;
    qrPaidOnly: string;
    saveDesign: string;
    exportPng: string;
    exportSvg: string;
    exportPdf: string;
    savedDesignsTitle: string;
    designNamePlaceholder: string;
    renameDesign: string;
    deleteDesign: string;
    empty: string;
  };
  analytics: {
    title: string;
    scans: string;
    views: string;
    returning: string;
    latestEvents: string;
    na: string;
    unknown: string;
    emptyEvents: string;
    trendsTitle: string;
    events: string;
    chartsPaidOnly: string;
    topLocales: string;
    localesPaidOnly: string;
    topDevices: string;
    devicesPaidOnly: string;
    advancedInsight: string;
    returningRatio: string;
  };
  templates: {
    title: string;
    styleEditorTab: string;
    mobilePreviewTab: string;
    mobilePreviewDescription: string;
    freePlanNotice: string;
    formatTitle: string;
    formatDescription: string;
    templateSuffix: string;
    liveControlsNotice: string;
    currentTemplate: string;
    useTemplate: string;
    styleTitle: string;
    fontFamily: string;
    layoutDensity: string;
    layoutDensityPlaceholder: string;
    densityComfortable: string;
    densityCompact: string;
    saveStyles: string;
    stylesSaved: string;
    stylePresetsHint: string;
    colorControlsHint: string;
  };
  billing: {
    title: string;
    currentPlan: string;
    currentTier: string;
    plan: string;
    tierSince: string;
    includedBenefits: string;
    availableUpgrades: string;
    alreadyTopTier: string;
    monthlySuffix: string;
    freePrice: string;
    upgradeTo: string;
    upgradeStarter: string;
    upgradePro: string;
    openPortal: string;
    statusMissingConfig: string;
  };
  team: {
    title: string;
    inviteTitle: string;
    invitePlaceholder: string;
    invite: string;
    membersTitle: string;
    invitePending: string;
    inviteLink: string;
    invited: string;
    alreadyMember: string;
    alreadyPending: string;
    you: string;
    changeRole: string;
    updateRole: string;
    removeMember: string;
    resendInvite: string;
  };
  settings: {
    title: string;
    saved: string;
    error: string;
    savedByCode: Record<string, string>;
    errorByCode: Record<string, string>;
    accountTitle: string;
    restaurantName: string;
    name: string;
    email: string;
    save: string;
    saveAccount: string;
    saveEmail: string;
    emailConfirmHint: string;
    preferencesTitle: string;
    adminLanguage: string;
    timezone: string;
    dateFormat: string;
    currencyFormat: string;
    savePreferences: string;
    notificationsTitle: string;
    notifInvites: string;
    notifBilling: string;
    notifWeekly: string;
    saveNotifications: string;
    billingTitle: string;
    currentPlan: string;
    limitItems: string;
    limitLanguages: string;
    limitMenus: string;
    openPortal: string;
    openBillingPage: string;
    billingHelp: string;
    securityTitle: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    changePassword: string;
    oauthPasswordHelp: string;
    closeOtherSessions: string;
  };
  themeControls: {
    restoreDefault: string;
    primaryColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    borderColor: string;
    livePreview: string;
    categoryA: string;
    categoryB: string;
    dishName: string;
    popular: string;
    dishDescription: string;
    dietaryTag: string;
  };
  itemForm: {
    tagsAndAllergens: string;
    suggestedDescriptionSuffix: string;
    imageAltPrefix: string;
    imageAltFallback: string;
    name: string;
    namePlaceholder: string;
    description: string;
    suggestDescription: string;
    descriptionPlaceholder: string;
    prices: string;
    addCurrency: string;
    removeCurrency: string;
    labelPlaceholder: string;
    currencyPlaceholder: string;
    multiCurrencyPaidOnly: string;
    imageUrl: string;
    autoAltText: string;
    featuredItem: string;
    spicy: string;
    vegan: string;
    vegetarian: string;
    glutenFree: string;
    livePreview: string;
    imagePreviewPlaceholder: string;
    imagePreviewFailed: string;
    dishNameFallback: string;
    dishDescriptionFallback: string;
  };
  itemImagePicker: {
    uploading: string;
    uploadFailedRetry: string;
    invalidUploadUrl: string;
    uploadReady: string;
    uploadFailedConnection: string;
    uploadImage: string;
    searchUnsplash: string;
    searchPexels: string;
    inputPlaceholder: string;
    helper: string;
    defaultQuery: string;
    unsplashAdjustedNotice: string;
    invalidUrlHelp: string;
    unsupportedStockPageHelp: string;
  };
};

const messages: Record<AdminLocale, AdminMessages> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      businessProfile: "Business profile",
      menus: "Categories",
      items: "Products",
      templates: "Styles",
      translations: "Translations",
      qr: "QR",
      analytics: "Analytics",
      billing: "Billing",
      team: "Team",
      settings: "Settings",
    },
    sidebar: {
      activeOrganization: "Active organization",
      workspace: "Workspace",
      organizationUpdated: "Active organization updated",
      organizationSelector: "Select active organization",
    },
    header: {
      switch: "Switch",
      signOut: "Sign out",
      organizationSelector: "Select active organization",
      language: "Language",
      languageEnglish: "English",
      languageSpanish: "Spanish",
      saveLanguage: "Apply",
      account: "Account",
      profile: "Profile",
    },
    dashboard: {
      title: "Dashboard",
      menus: "Categories",
      items: "Products",
      events: "Events",
      workspace: "Workspace",
      organization: "Organization",
      plan: "Plan",
      checklistTitle: "Go-live checklist",
      checklistDoneHint: "All steps completed. You can close this checklist.",
      checklistDismiss: "Hide checklist",
      open: "Open",
      checklist: {
        resourceConfigured: "Resource configured",
        atLeastOneMenu: "At least one category",
        atLeastThreeItems: "At least three items",
        templateSelected: "Template selected",
        qrDesignSaved: "QR design saved",
      },
    },
    resource: {
      title: "Business profile settings",
      noResource: "No resource found.",
      brandDomain: "Profile",
      whatIsResource: "This section configures your public business page (name, URL, language, currency, and domains).",
      name: "Name",
      slug: "Menu URL",
      defaultLocale: "Default locale",
      defaultCurrency: "Default currency",
      enabledLocales: "Enabled locales",
      enabledCurrencies: "Enabled currencies",
      multiCurrencyPaidOnly: "Multi-currency configuration is available on paid plans.",
      rootDomain: "Root domain",
      customDomain: "Custom domain",
      customDomainPlaceholder: "menu.yourdomain.com",
      customDomainProOnly: "Custom domain is available on Pro.",
      save: "Save resource",
      saving: "Saving...",
      saveSuccess: "Resource saved successfully.",
      saveError: "Could not save changes. Please try again.",
      saveErrorSlug: "That menu URL is already in use. Choose a different one.",
    },
    menus: {
      title: "Categories",
      createTitle: "Create category",
      namePlaceholder: "Drinks",
      add: "Add",
      save: "Save",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this category?",
      existingTitle: "Existing categories",
      categories: "subcategories",
      empty: "No categories yet.",
    },
    items: {
      title: "Products",
      createTitle: "Create product",
      category: "Category",
      allergens: "Allergens",
      upgradeToUnlock: "Upgrade to unlock",
      allergensPaidOnly: "Allergen labels are available on paid plans.",
      save: "Save product",
      delete: "Delete product",
      deleteConfirm: "Are you sure you want to delete this product?",
      currentTitle: "Current products",
      optimizedImage: "Fast loading enabled",
      compatibleImage: "Compatible image (might load slower)",
      noPhoto: "This item has no photo. Adding one usually improves mobile conversion.",
      featured: "Chef recommendation",
      vegan: "Vegan",
      vegetarian: "Vegetarian",
      glutenFree: "Gluten free",
      spicy: "Spicy",
      empty: "No products yet.",
    },
    translations: {
      title: "Translations",
      aiQueueTitle: "Translate your menu",
      aiQueueDescription:
        'Generate translations for your enabled languages. Review them in "Recent translations" and edit any text if needed.',
      translateNow: "Generate translations now",
      recentTranslationsTitle: "Recent translations",
      fieldName: "Name",
      fieldDescription: "Description",
      fieldPriceLabel: "Price label",
      sourceAi: "Automatic",
      sourceManual: "Manual",
      overridePlaceholder: "Edit this translation",
      override: "Edit",
      empty: "No translations yet. Generate your first batch to get started.",
    },
    qr: {
      title: "QR Generator",
      designTitle: "Design your QR",
      preview: "Live preview",
      dotsColor: "Dots color",
      backgroundColor: "Background color",
      dotStyle: "Dot style",
      dotStyleSquare: "Square",
      dotStyleRounded: "Rounded",
      dotStyleDots: "Dots",
      dotStyleHeart: "Heart",
      cornerStyle: "Corner style",
      cornerStyleSquare: "Square",
      cornerStyleRounded: "Rounded",
      cornerStyleDot: "Dot",
      cornerStyleHeart: "Heart",
      icon: "Center icon",
      iconPresets: "Quick icons",
      iconColor: "Icon color",
      noIcon: "No icon",
      uploadIcon: "Upload icon",
      iconUploadHelp: "Allowed formats: PNG, JPG, WEBP or GIF (max 5MB). SVG is not supported.",
      qrPaidOnly: "QR branding and saved designs are available on paid plans.",
      saveDesign: "Save design",
      exportPng: "Export PNG",
      exportSvg: "Export SVG",
      exportPdf: "Export PDF",
      savedDesignsTitle: "Saved designs",
      designNamePlaceholder: "Design name",
      renameDesign: "Rename",
      deleteDesign: "Delete",
      empty: "No designs yet.",
    },
    analytics: {
      title: "Analytics",
      scans: "Scans",
      views: "Views",
      returning: "Returning",
      latestEvents: "Latest events",
      na: "n/a",
      unknown: "unknown",
      emptyEvents: "No events yet.",
      trendsTitle: "Trends (last 14 days)",
      events: "events",
      chartsPaidOnly: "Charts are available on paid plans.",
      topLocales: "Top locales",
      localesPaidOnly: "Locale ranking is available on paid plans.",
      topDevices: "Top devices",
      devicesPaidOnly: "Device ranking is available on paid plans.",
      advancedInsight: "Advanced insight",
      returningRatio: "Returning visitors ratio",
    },
    templates: {
      title: "Styles",
      styleEditorTab: "Style editor",
      mobilePreviewTab: "Mobile live preview",
      mobilePreviewDescription:
        "Real mobile mockup with your current menu content as customers see it in the selected template.",
      freePlanNotice: "Free plan includes Classic template. Upgrade to Starter to unlock Modern and Grid.",
      formatTitle: "Format",
      formatDescription: "Choose the base layout of your menu.",
      templateSuffix: "template",
      liveControlsNotice: "Choose a base template and adjust colors in live preview.",
      currentTemplate: "Current template",
      useTemplate: "Use this template",
      styleTitle: "Visual styles",
      fontFamily: "Font family",
      layoutDensity: "Layout density",
      layoutDensityPlaceholder: "comfortable or compact",
      densityComfortable: "Spacious",
      densityCompact: "Compact",
      saveStyles: "Save styles",
      stylesSaved: "Styles saved successfully.",
      stylePresetsHint: "Start with a preset and then fine-tune details.",
      colorControlsHint: "Customize your color palette to match your brand.",
    },
    billing: {
      title: "Billing",
      currentPlan: "Current plan",
      currentTier: "Current tier",
      plan: "Plan",
      tierSince: "Active since",
      includedBenefits: "Included benefits",
      availableUpgrades: "Available upgrades",
      alreadyTopTier: "You are already on the highest plan.",
      monthlySuffix: "month",
      freePrice: "Free",
      upgradeTo: "Upgrade to",
      upgradeStarter: "Upgrade to Starter",
      upgradePro: "Upgrade to Pro",
      openPortal: "Open customer portal",
      statusMissingConfig: "Billing is not configured yet. Set Stripe keys and prices in your environment variables.",
    },
    team: {
      title: "Team",
      inviteTitle: "Invite member",
      invitePlaceholder: "manager@restaurant.com",
      invite: "Invite",
      membersTitle: "Members",
      invitePending: "Invite pending",
      inviteLink: "Invite link",
      invited: "Invitation sent.",
      alreadyMember: "That email is already a member of this workspace.",
      alreadyPending: "There is already a pending invitation for that email. We re-sent it.",
      you: "You",
      changeRole: "Change member role",
      updateRole: "Update role",
      removeMember: "Remove user",
      resendInvite: "Resend invite",
    },
    settings: {
      title: "Settings",
      saved: "Settings updated successfully.",
      error: "Could not save settings. Check your data and try again.",
      savedByCode: {
        account: "Account profile updated.",
        "account-email": "Email updated.",
        "account-email-pending": "Check your inbox and confirm the new email to complete the change.",
        "account-email-confirmed": "Your email was confirmed and updated.",
        resource: "Business profile updated.",
        preferences: "Preferences saved.",
        notifications: "Notification preferences saved.",
        password: "Password updated.",
        sessions: "Other sessions closed.",
        analytics: "Analytics settings saved.",
      },
      errorByCode: {
        "account-email": "Please enter a valid email address.",
        "account-email-taken": "That email is already in use by another account.",
        "account-email-token": "Invalid email confirmation link.",
        "account-email-expired": "This email confirmation link has expired.",
        resource: "Could not save business profile. Please try again.",
        "resource-slug": "That menu URL is already in use. Choose a different one.",
        "resource-locales":
          "Some selected languages are not available in the configured translation engines.",
        "password-length": "New password must be at least 8 characters.",
        "password-mismatch": "New password and confirmation do not match.",
        "password-oauth": "This account uses social login and has no local password.",
        "password-current": "Current password is incorrect.",
      },
      accountTitle: "Account profile",
      restaurantName: "Restaurant name",
      name: "Name",
      email: "Email",
      save: "Save",
      saveAccount: "Save account",
      saveEmail: "Save email",
      emailConfirmHint: "For security, email changes require confirmation from the new address.",
      preferencesTitle: "Workspace preferences",
      adminLanguage: "Admin language",
      timezone: "Timezone",
      dateFormat: "Date format",
      currencyFormat: "Currency format",
      savePreferences: "Save preferences",
      notificationsTitle: "Notifications",
      notifInvites: "Invitations and team changes",
      notifBilling: "Billing alerts",
      notifWeekly: "Weekly analytics summary",
      saveNotifications: "Save notifications",
      billingTitle: "Billing and usage",
      currentPlan: "Current plan",
      limitItems: "Items used",
      limitLanguages: "Enabled languages",
      limitMenus: "Published categories",
      openPortal: "Open customer portal",
      openBillingPage: "Open billing page",
      billingHelp: "Payment method and invoices are managed in the customer portal.",
      securityTitle: "Security",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      changePassword: "Change password",
      oauthPasswordHelp: "This account uses social login, so password change is unavailable.",
      closeOtherSessions: "Close other sessions",
    },
    themeControls: {
      restoreDefault: "Restore default",
      primaryColor: "Primary color",
      backgroundColor: "Background color",
      surfaceColor: "Surface color",
      textColor: "Text color",
      borderColor: "Border color",
      livePreview: "Live preview",
      categoryA: "Starters",
      categoryB: "Pasta",
      dishName: "Tagliatelle al ragu",
      popular: "Popular",
      dishDescription: "Handmade pasta slow-cooked for deep flavor",
      dietaryTag: "Vegan",
    },
    itemForm: {
      tagsAndAllergens: "Allergens and tags",
      suggestedDescriptionSuffix: "prepared with fresh ingredients and homemade flavor.",
      imageAltPrefix: "Dish photo",
      imageAltFallback: "Dish photo",
      name: "Name",
      namePlaceholder: "Margherita",
      description: "Description",
      suggestDescription: "Suggest description",
      descriptionPlaceholder: "Tomato, mozzarella, basil",
      prices: "Prices (multiple currencies)",
      addCurrency: "Add currency",
      removeCurrency: "Remove",
      labelPlaceholder: "Label",
      currencyPlaceholder: "Currency",
      multiCurrencyPaidOnly: "Multi-currency prices are available on paid plans.",
      imageUrl: "Image URL",
      autoAltText: "Automatic alt text",
      featuredItem: "Chef recommendation",
      spicy: "Spicy",
      vegan: "Vegan",
      vegetarian: "Vegetarian",
      glutenFree: "Gluten free",
      livePreview: "Live preview",
      imagePreviewPlaceholder: "Your photo will appear here",
      imagePreviewFailed: "We couldn't preview this URL. Use a direct image link or upload the file.",
      dishNameFallback: "Dish name",
      dishDescriptionFallback: "A short dish description to trigger appetite.",
    },
    itemImagePicker: {
      uploading: "Uploading image...",
      uploadFailedRetry: "Could not upload image. Try again.",
      invalidUploadUrl: "Upload did not return a valid URL.",
      uploadReady: "Image uploaded and ready to use.",
      uploadFailedConnection: "Could not upload image. Check your connection.",
      uploadImage: "Upload image",
      searchUnsplash: "Search on Unsplash",
      searchPexels: "Search on Pexels",
      inputPlaceholder: "https://... (or use Upload image)",
      helper:
        "Tip: open Unsplash/Pexels, choose a photo, and paste its URL here. Unsplash and Pexels page links are converted automatically when possible.",
      defaultQuery: "food dish",
      unsplashAdjustedNotice: "We adjusted the link so the photo can be shown here.",
      invalidUrlHelp: "Invalid URL. Paste a full URL starting with https://",
      unsupportedStockPageHelp:
        "This still looks like a stock photo page URL. Open the photo page and paste that URL, or upload the image.",
    },
  },
  es: {
    nav: {
      dashboard: "Panel",
      businessProfile: "Perfil del negocio",
      menus: "Categorías",
      items: "Productos",
      templates: "Estilos",
      translations: "Traducciones",
      qr: "QR",
      analytics: "Analíticas",
      billing: "Facturación",
      team: "Equipo",
      settings: "Ajustes",
    },
    sidebar: {
      activeOrganization: "Organización activa",
      workspace: "Espacio",
      organizationUpdated: "Organización activa actualizada",
      organizationSelector: "Seleccionar organización activa",
    },
    header: {
      switch: "Cambiar",
      signOut: "Cerrar sesión",
      organizationSelector: "Seleccionar organización activa",
      language: "Idioma",
      languageEnglish: "Inglés",
      languageSpanish: "Español",
      saveLanguage: "Aplicar",
      account: "Cuenta",
      profile: "Perfil",
    },
    dashboard: {
      title: "Panel",
      menus: "Categorías",
      items: "Productos",
      events: "Eventos",
      workspace: "Espacio",
      organization: "Organización",
      plan: "Plan",
      checklistTitle: "Checklist de lanzamiento",
      checklistDoneHint: "Has completado todos los pasos. Ya puedes cerrar este checklist.",
      checklistDismiss: "Cerrar checklist",
      open: "Abrir",
      checklist: {
        resourceConfigured: "Recurso configurado",
        atLeastOneMenu: "Al menos una categoría",
        atLeastThreeItems: "Al menos tres ítems",
        templateSelected: "Plantilla seleccionada",
        qrDesignSaved: "Diseño QR guardado",
      },
    },
    resource: {
      title: "Configuración del perfil del negocio",
      noResource: "No se encontró el recurso.",
      brandDomain: "Perfil",
      whatIsResource: "Esta sección configura tu ficha pública del negocio (nombre, URL, idioma, moneda y dominios).",
      name: "Nombre",
      slug: "URL del menú",
      defaultLocale: "Idioma por defecto",
      defaultCurrency: "Moneda por defecto",
      enabledLocales: "Idiomas habilitados",
      enabledCurrencies: "Monedas habilitadas",
      multiCurrencyPaidOnly: "La configuración multimoneda está disponible en planes de pago.",
      rootDomain: "Dominio raíz",
      customDomain: "Dominio personalizado",
      customDomainPlaceholder: "menu.tudominio.com",
      customDomainProOnly: "El dominio personalizado está disponible en Pro.",
      save: "Guardar recurso",
      saving: "Guardando...",
      saveSuccess: "Recurso guardado correctamente.",
      saveError: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
      saveErrorSlug: "Esa URL del menú ya está en uso. Elige otra.",
    },
    menus: {
      title: "Categorías",
      createTitle: "Crear categoría",
      namePlaceholder: "Bebidas",
      add: "Añadir",
      save: "Guardar",
      delete: "Borrar",
      deleteConfirm: "¿Seguro que quieres borrar esta categoría?",
      existingTitle: "Categorías existentes",
      categories: "subcategorías",
      empty: "Aún no hay categorías.",
    },
    items: {
      title: "Productos",
      createTitle: "Crear producto",
      category: "Categoría",
      allergens: "Alérgenos",
      upgradeToUnlock: "Mejorar plan para desbloquear",
      allergensPaidOnly: "Las etiquetas de alérgenos están disponibles en planes de pago.",
      save: "Guardar producto",
      delete: "Borrar producto",
      deleteConfirm: "¿Seguro que quieres borrar este producto?",
      currentTitle: "Productos actuales",
      optimizedImage: "Carga rápida activada",
      compatibleImage: "Imagen compatible (puede cargar más lento)",
      noPhoto: "Este ítem no tiene foto. Agregar una imagen suele mejorar la conversión en móviles.",
      featured: "Recomendación del chef",
      vegan: "Vegano",
      vegetarian: "Vegetariano",
      glutenFree: "Sin gluten",
      spicy: "Picante",
      empty: "Aún no hay productos.",
    },
    translations: {
      title: "Traducciones",
      aiQueueTitle: "Traduce tu menú",
      aiQueueDescription:
        'Genera traducciones para tus idiomas habilitados. Revísalas en "Traducciones recientes" y edita cualquier texto si hace falta.',
      translateNow: "Generar traducciones ahora",
      recentTranslationsTitle: "Traducciones recientes",
      fieldName: "Nombre",
      fieldDescription: "Descripción",
      fieldPriceLabel: "Etiqueta de precio",
      sourceAi: "Automática",
      sourceManual: "Manual",
      overridePlaceholder: "Edita esta traducción",
      override: "Editar",
      empty: "Aún no hay traducciones. Genera la primera tanda para empezar.",
    },
    qr: {
      title: "Generador QR",
      designTitle: "Diseña tu QR",
      preview: "Vista previa en vivo",
      dotsColor: "Color de puntos",
      backgroundColor: "Color de fondo",
      dotStyle: "Estilo de puntos",
      dotStyleSquare: "Cuadrado",
      dotStyleRounded: "Redondeado",
      dotStyleDots: "Puntos",
      dotStyleHeart: "Corazon",
      cornerStyle: "Estilo de esquinas",
      cornerStyleSquare: "Cuadrado",
      cornerStyleRounded: "Redondeado",
      cornerStyleDot: "Punto",
      cornerStyleHeart: "Corazon",
      icon: "Icono central",
      iconPresets: "Iconos rapidos",
      iconColor: "Color del icono",
      noIcon: "Sin icono",
      uploadIcon: "Subir icono",
      iconUploadHelp: "Formatos permitidos: PNG, JPG, WEBP o GIF (max 5MB). SVG no es compatible.",
      qrPaidOnly: "El branding QR y guardar diseños está disponible en planes de pago.",
      saveDesign: "Guardar diseño",
      exportPng: "Exportar PNG",
      exportSvg: "Exportar SVG",
      exportPdf: "Exportar PDF",
      savedDesignsTitle: "Diseños guardados",
      designNamePlaceholder: "Nombre del diseño",
      renameDesign: "Renombrar",
      deleteDesign: "Borrar",
      empty: "Aún no hay diseños.",
    },
    analytics: {
      title: "Analíticas",
      scans: "Escaneos",
      views: "Vistas",
      returning: "Recurrentes",
      latestEvents: "Eventos recientes",
      na: "n/d",
      unknown: "desconocido",
      emptyEvents: "Aún no hay eventos.",
      trendsTitle: "Tendencias (últimos 14 días)",
      events: "eventos",
      chartsPaidOnly: "Los gráficos están disponibles en planes de pago.",
      topLocales: "Idiomas principales",
      localesPaidOnly: "El ranking por idioma está disponible en planes de pago.",
      topDevices: "Dispositivos principales",
      devicesPaidOnly: "El ranking por dispositivo está disponible en planes de pago.",
      advancedInsight: "Insight avanzado",
      returningRatio: "Ratio de visitantes recurrentes",
    },
    templates: {
      title: "Estilos",
      styleEditorTab: "Editor de estilos",
      mobilePreviewTab: "Previsualización móvil real",
      mobilePreviewDescription:
        "Mockup móvil real con el contenido actual de tu menú tal y como lo verá el cliente en la plantilla seleccionada.",
      freePlanNotice: "El plan Free incluye la plantilla Classic. Mejora a Starter para desbloquear Modern y Grid.",
      formatTitle: "Formato",
      formatDescription: "Elige la estructura base con la que se mostrará tu menú.",
      templateSuffix: "plantilla",
      liveControlsNotice: "Elige una plantilla base y ajusta colores con previsualización de ejemplo.",
      currentTemplate: "Plantilla actual",
      useTemplate: "Usar esta plantilla",
      styleTitle: "Estilos visuales",
      fontFamily: "Familia tipográfica",
      layoutDensity: "Densidad del diseño",
      layoutDensityPlaceholder: "comfortable o compact",
      densityComfortable: "Amplia",
      densityCompact: "Compacta",
      saveStyles: "Guardar estilos",
      stylesSaved: "Estilos guardados correctamente.",
      stylePresetsHint: "Empieza con un preset y después ajusta los detalles.",
      colorControlsHint: "Personaliza la paleta de colores para que encaje con tu marca.",
    },
    billing: {
      title: "Facturación",
      currentPlan: "Plan actual",
      currentTier: "Tier actual",
      plan: "Plan",
      tierSince: "Activo desde",
      includedBenefits: "Beneficios incluidos",
      availableUpgrades: "Mejoras disponibles",
      alreadyTopTier: "Ya estás en el plan más alto.",
      monthlySuffix: "mes",
      freePrice: "Gratis",
      upgradeTo: "Mejorar a",
      upgradeStarter: "Mejorar a Starter",
      upgradePro: "Mejorar a Pro",
      openPortal: "Abrir portal de cliente",
      statusMissingConfig: "La facturación aún no está configurada. Define claves y precios de Stripe en las variables de entorno.",
    },
    team: {
      title: "Equipo",
      inviteTitle: "Invitar miembro",
      invitePlaceholder: "manager@restaurante.com",
      invite: "Invitar",
      membersTitle: "Miembros",
      invitePending: "Invitación pendiente",
      inviteLink: "Enlace de invitación",
      invited: "Invitación enviada.",
      alreadyMember: "Ese email ya pertenece a este espacio.",
      alreadyPending: "Ya existe una invitación pendiente para ese email. La reenviamos.",
      you: "Tú",
      changeRole: "Cambiar rol del miembro",
      updateRole: "Actualizar rol",
      removeMember: "Eliminar usuario",
      resendInvite: "Reenviar invitación",
    },
    settings: {
      title: "Ajustes",
      saved: "Ajustes actualizados correctamente.",
      error: "No se pudieron guardar los ajustes. Revisa los datos e inténtalo de nuevo.",
      savedByCode: {
        account: "Perfil de cuenta actualizado.",
        "account-email": "Email actualizado.",
        "account-email-pending": "Revisa tu inbox y confirma el nuevo email para completar el cambio.",
        "account-email-confirmed": "Tu email fue confirmado y actualizado.",
        resource: "Perfil del negocio actualizado.",
        preferences: "Preferencias guardadas.",
        notifications: "Preferencias de notificaciones guardadas.",
        password: "Contraseña actualizada.",
        sessions: "Se cerraron las otras sesiones.",
        analytics: "Ajustes de analíticas guardados.",
      },
      errorByCode: {
        "account-email": "Introduce un email válido.",
        "account-email-taken": "Ese email ya está en uso por otra cuenta.",
        "account-email-token": "Enlace de confirmación de email no válido.",
        "account-email-expired": "Este enlace de confirmación de email ha caducado.",
        resource: "No se pudo guardar el perfil del negocio. Inténtalo de nuevo.",
        "resource-slug": "Esa URL del menú ya está en uso. Elige otra.",
        "resource-locales":
          "Algunos idiomas seleccionados no están disponibles en los motores de traducción configurados.",
        "password-length": "La nueva contraseña debe tener al menos 8 caracteres.",
        "password-mismatch": "La nueva contraseña y su confirmación no coinciden.",
        "password-oauth": "Esta cuenta usa login social y no tiene contraseña local.",
        "password-current": "La contraseña actual es incorrecta.",
      },
      accountTitle: "Perfil de cuenta",
      restaurantName: "Nombre del restaurante",
      name: "Nombre",
      email: "Email",
      save: "Guardar",
      saveAccount: "Guardar cuenta",
      saveEmail: "Guardar email",
      emailConfirmHint: "Por seguridad, el cambio de email requiere confirmación desde la nueva dirección.",
      preferencesTitle: "Preferencias del espacio",
      adminLanguage: "Idioma del panel",
      timezone: "Zona horaria",
      dateFormat: "Formato de fecha",
      currencyFormat: "Formato de moneda",
      savePreferences: "Guardar preferencias",
      notificationsTitle: "Notificaciones",
      notifInvites: "Invitaciones y cambios de equipo",
      notifBilling: "Alertas de facturación",
      notifWeekly: "Resumen semanal de analíticas",
      saveNotifications: "Guardar notificaciones",
      billingTitle: "Facturación y uso",
      currentPlan: "Plan actual",
      limitItems: "Ítems usados",
      limitLanguages: "Idiomas habilitados",
      limitMenus: "Categorías publicadas",
      openPortal: "Abrir portal de cliente",
      openBillingPage: "Abrir página de facturación",
      billingHelp: "El método de pago y las facturas se gestionan en el portal de cliente.",
      securityTitle: "Seguridad",
      currentPassword: "Contraseña actual",
      newPassword: "Nueva contraseña",
      confirmPassword: "Confirmar contraseña",
      changePassword: "Cambiar contraseña",
      oauthPasswordHelp: "Esta cuenta usa acceso social, por eso no permite cambiar contraseña aquí.",
      closeOtherSessions: "Cerrar otras sesiones",
    },
    themeControls: {
      restoreDefault: "Restaurar por defecto",
      primaryColor: "Color principal",
      backgroundColor: "Color de fondo",
      surfaceColor: "Color de superficie",
      textColor: "Color de texto",
      borderColor: "Color de borde",
      livePreview: "Previsualización de ejemplo",
      categoryA: "Entrantes",
      categoryB: "Pasta",
      dishName: "Tagliatelle al ragú",
      popular: "Popular",
      dishDescription: "Pasta artesanal cocinada a fuego lento",
      dietaryTag: "Vegano",
    },
    itemForm: {
      tagsAndAllergens: "Alérgenos y etiquetas",
      suggestedDescriptionSuffix: "preparado con ingredientes frescos y sabor casero.",
      imageAltPrefix: "Foto del plato",
      imageAltFallback: "Foto del plato",
      name: "Nombre",
      namePlaceholder: "Margarita",
      description: "Descripción",
      suggestDescription: "Sugerir descripción",
      descriptionPlaceholder: "Tomate, mozzarella, albahaca",
      prices: "Precios (múltiples monedas)",
      addCurrency: "Añadir divisa",
      removeCurrency: "Quitar",
      labelPlaceholder: "Etiqueta",
      currencyPlaceholder: "Moneda",
      multiCurrencyPaidOnly: "Los precios multimoneda están disponibles en planes de pago.",
      imageUrl: "URL de imagen",
      autoAltText: "Texto alternativo automático",
      featuredItem: "Recomendación del chef",
      spicy: "Picante",
      vegan: "Vegano",
      vegetarian: "Vegetariano",
      glutenFree: "Sin gluten",
      livePreview: "Vista previa en vivo",
      imagePreviewPlaceholder: "Tu foto aparecerá aquí",
      imagePreviewFailed:
        "No pudimos previsualizar esta URL. Usa un enlace directo a imagen o sube el archivo.",
      dishNameFallback: "Nombre del plato",
      dishDescriptionFallback: "Descripción breve del plato para abrir el apetito.",
    },
    itemImagePicker: {
      uploading: "Subiendo imagen...",
      uploadFailedRetry: "No se pudo subir la imagen. Prueba otra vez.",
      invalidUploadUrl: "La subida no devolvió una URL válida.",
      uploadReady: "Imagen subida y lista para usar.",
      uploadFailedConnection: "No se pudo subir la imagen. Revisa tu conexión.",
      uploadImage: "Subir imagen",
      searchUnsplash: "Buscar en Unsplash",
      searchPexels: "Buscar en Pexels",
      inputPlaceholder: "https://... (o usa Subir imagen)",
      helper:
        "Consejo: abre Unsplash/Pexels, elige una foto y pega aquí su URL. Si pegas una URL de página de Unsplash o Pexels, la convertimos automáticamente cuando sea posible.",
      defaultQuery: "plato de comida",
      unsplashAdjustedNotice: "Hemos ajustado el enlace para que la foto se vea aquí.",
      invalidUrlHelp: "URL no válida. Pega una URL completa que empiece por https://",
      unsupportedStockPageHelp:
        "Sigue pareciendo una URL de página de banco de imágenes. Abre la página de la foto y pega esa URL, o sube la imagen.",
    },
  },
};

function normalizeLocale(value: string | null | undefined): AdminLocale | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("en")) return "en";
  return null;
}

export async function getAdminLocale(): Promise<AdminLocale> {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get("NEXT_LOCALE")?.value);
  if (cookieLocale) return cookieLocale;

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language")?.split(",")[0];
  return normalizeLocale(acceptLanguage) ?? "en";
}

export function getAdminMessages(locale: AdminLocale): AdminMessages {
  return messages[locale] ?? messages.en;
}
