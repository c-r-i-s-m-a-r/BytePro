<template>
  <div class="container account-page">
    <div class="account-hero card mb-6">
      <div class="account-hero-user">
        <div class="account-hero-avatar">
          <img
            v-if="userInfo.fotoPerfil"
            :src="userInfo.fotoPerfil"
            :alt="userInfo.nombre || 'Perfil'"
          />
          <span v-else>{{ inicialesUsuario }}</span>
        </div>
        <div>
          <span class="account-eyebrow">Centro de Cuenta</span>
          <h1 class="account-hero-name">{{ userInfo.nombre || auth.user?.nombre || 'Mi Cuenta' }}</h1>
          <p class="account-hero-email">{{ userInfo.email || auth.user?.email }}</p>
        </div>
      </div>

      <div class="account-hero-stats">
        <div class="account-stat">
          <span class="account-stat-value">{{ pedidosEnCurso.length }}</span>
          <span class="account-stat-label">En curso</span>
        </div>
        <div class="account-stat">
          <span class="account-stat-value">{{ direcciones.length }}</span>
          <span class="account-stat-label">Direcciones</span>
        </div>
        <div class="account-stat">
          <span class="account-stat-value">{{ tarjetas.length }}</span>
          <span class="account-stat-label">Tarjetas</span>
        </div>
      </div>
    </div>

    <div class="account-layout">
      <!-- Menú Lateral (Desktop) / Tabs horizontales (Móvil) -->
      <aside class="account-sidebar" aria-label="Menú de cuenta">
        <nav class="account-nav card">
          <div class="account-nav-group">
            <span class="account-nav-heading">Perfil y Seguridad</span>
            <button
              type="button"
              class="account-nav-btn"
              :class="{ active: tab === 'perfil' }"
              @click="setTab('perfil')"
            >
              <span class="account-nav-label">Nombre e imagen</span>
            </button>
            <button
              type="button"
              class="account-nav-btn"
              :class="{ active: tab === 'correo' }"
              @click="setTab('correo')"
            >
              <span class="account-nav-label">Cambio de correo</span>
            </button>
            <button
              type="button"
              class="account-nav-btn"
              :class="{ active: tab === 'direccion' }"
              @click="setTab('direccion')"
            >
              <span class="account-nav-label">Ubicaciones de envío</span>
            </button>
            <button
              type="button"
              class="account-nav-btn"
              :class="{ active: tab === 'tarjetas' }"
              @click="setTab('tarjetas')"
            >
              <span class="account-nav-label">Tarjetas asociadas</span>
            </button>
            <button
              type="button"
              class="account-nav-btn"
              :class="{ active: tab === 'password' }"
              @click="setTab('password')"
            >
              <span class="account-nav-label">Cambio de contraseña</span>
            </button>
          </div>

          <div class="account-nav-group">
            <span class="account-nav-heading">Actividad</span>
            <button
              type="button"
              class="account-nav-btn"
              :class="{ active: tab === 'pedidos' }"
              @click="setTab('pedidos')"
            >
              <span class="account-nav-icon"><AppIcon name="truck-side" :size="18" /></span>
              <span class="account-nav-label">Pedidos en curso</span>
              <span v-if="pedidosEnCurso.length" class="badge-count">{{ pedidosEnCurso.length }}</span>
            </button>
            <button
              type="button"
              class="account-nav-btn"
              :class="{ active: tab === 'historial' }"
              @click="setTab('historial')"
            >
              <span class="account-nav-icon"><AppIcon name="cube" :size="18" /></span>
              <span class="account-nav-label">Historial de pedidos</span>
            </button>
            <button
              type="button"
              class="account-nav-btn"
              :class="{ active: tab === 'reclamos' }"
              @click="setTab('reclamos')"
            >
              <span class="account-nav-icon"><AppIcon name="help" :size="18" /></span>
              <span class="account-nav-label">Historial de reclamos</span>
              <span v-if="reclamos.length" class="badge-count">{{ reclamos.length }}</span>
            </button>
          </div>

          <div class="account-nav-group account-nav-group-danger">
            <button
              type="button"
              class="account-nav-btn account-nav-btn-danger"
              :class="{ active: tab === 'eliminar' }"
              @click="setTab('eliminar')"
            >
              <span class="account-nav-icon"><AppIcon name="sign-out" :size="18" /></span>
              <span class="account-nav-label">Eliminación de cuenta</span>
            </button>
          </div>
        </nav>
      </aside>

      <!-- Contenido Principal -->
      <main class="account-content">
        <div v-if="cargando" class="card account-loading">
          <p class="muted">Cargando información de tu cuenta…</p>
        </div>

        <template v-else>
          <!-- 1. PERFIL: Nombre e imagen -->
          <section v-if="tab === 'perfil'" class="card account-panel">
            <div class="account-panel-header">
              <h2>Nombre e imagen de perfil</h2>
              <p class="field-hint">Personaliza tu nombre visible y fotografía en BytePro.</p>
            </div>

            <form class="account-form" @submit.prevent="guardarPerfil">
              <div class="profile-avatar-editor">
                <div class="profile-avatar-circle">
                  <img
                    v-if="perfilForm.fotoPerfil"
                    :src="perfilForm.fotoPerfil"
                    alt="Foto de perfil"
                  />
                  <span v-else class="profile-avatar-initials">{{ inicialesUsuario }}</span>
                </div>
                <div class="profile-avatar-controls">
                  <label class="btn btn-secondary btn-sm avatar-upload-label">
                    <AppIcon name="camera" :size="16" />
                    <span>{{ procesandoImagen ? 'Procesando…' : 'Cambiar imagen' }}</span>
                    <input
                      ref="avatarInput"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      class="sr-only"
                      :disabled="procesandoImagen"
                      @change="onFotoSeleccionada"
                    />
                  </label>
                  <button
                    v-if="perfilForm.fotoPerfil"
                    type="button"
                    class="btn btn-tertiary btn-sm"
                    @click="quitarFotoPerfil"
                  >
                    Quitar foto
                  </button>
                  <p class="field-hint">Formatos PNG, JPEG o WEBP. Se optimiza automáticamente.</p>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="field">
                  <label for="perfil-nombre">Nombre completo *</label>
                  <input
                    id="perfil-nombre"
                    v-model="perfilForm.nombre"
                    class="input"
                    type="text"
                    required
                    maxlength="120"
                  />
                </div>
                <div class="field">
                  <label for="perfil-telefono">Teléfono de contacto</label>
                  <input
                    id="perfil-telefono"
                    v-model="perfilForm.telefono"
                    class="input"
                    type="tel"
                    placeholder="Ej. 70012345"
                    maxlength="40"
                  />
                </div>
              </div>

              <div class="account-form-actions">
                <button type="submit" class="btn btn-primary" :disabled="guardandoPerfil">
                  {{ guardandoPerfil ? 'Guardando…' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </section>

          <!-- 2. CORREO: Cambio de correo -->
          <section v-else-if="tab === 'correo'" class="card account-panel">
            <div class="account-panel-header">
              <h2>Cambio de correo electrónico</h2>
              <p class="field-hint">
                Por seguridad, confirma tu contraseña actual para vincular una nueva dirección.
              </p>
            </div>

            <form class="account-form" @submit.prevent="actualizarCorreo">
              <div class="field">
                <label for="correo-actual">Correo actual</label>
                <input
                  id="correo-actual"
                  :value="userInfo.email"
                  class="input"
                  type="email"
                  disabled
                />
              </div>

              <div class="form-grid-2">
                <div class="field">
                  <label for="correo-nuevo">Nuevo correo electrónico *</label>
                  <input
                    id="correo-nuevo"
                    v-model="correoForm.email"
                    class="input"
                    type="email"
                    placeholder="nuevo@correo.com"
                    required
                  />
                </div>
                <div class="field">
                  <label for="correo-password">Contraseña actual *</label>
                  <input
                    id="correo-password"
                    v-model="correoForm.passwordActual"
                    class="input"
                    type="password"
                    autocomplete="current-password"
                    required
                  />
                </div>
              </div>

              <div class="account-form-actions">
                <button type="submit" class="btn btn-primary" :disabled="guardandoCorreo">
                  {{ guardandoCorreo ? 'Actualizando…' : 'Actualizar Correo' }}
                </button>
              </div>
            </form>
          </section>

          <!-- 3. DIRECCION: Ubicaciones de envío -->
          <section v-else-if="tab === 'direccion'" class="card account-panel">
            <div class="account-panel-header flex-between">
              <div>
                <h2>Ubicaciones de envío</h2>
                <p class="field-hint">Administra tus direcciones guardadas para un checkout más rápido.</p>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                @click="mostrarFormDireccion = !mostrarFormDireccion"
              >
                {{ mostrarFormDireccion ? 'Cerrar formulario' : '+ Agregar Dirección' }}
              </button>
            </div>

            <form
              v-if="mostrarFormDireccion"
              class="account-subform mb-5"
              @submit.prevent="agregarDireccion"
            >
              <h3 class="subform-title">Nueva dirección de envío</h3>
              <div class="form-grid-2">
                <div class="field">
                  <label for="dir-etiqueta">Etiqueta *</label>
                  <input
                    id="dir-etiqueta"
                    v-model="direccionForm.etiqueta"
                    class="input"
                    placeholder="Ej. Casa, Oficina"
                    required
                  />
                </div>
                <div class="field">
                  <label for="dir-destinatario">Nombre del destinatario *</label>
                  <input
                    id="dir-destinatario"
                    v-model="direccionForm.nombreDestinatario"
                    class="input"
                    required
                  />
                </div>
                <div class="field">
                  <label for="dir-ciudad">Ciudad *</label>
                  <select id="dir-ciudad" v-model="direccionForm.ciudad" class="select" required>
                    <option value="">Selecciona una ciudad</option>
                    <option v-for="c in CIUDADES_BOLIVIA" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
                <div class="field">
                  <label for="dir-telefono">Teléfono de contacto *</label>
                  <input
                    id="dir-telefono"
                    v-model="direccionForm.telefono"
                    class="input"
                    type="tel"
                    placeholder="70012345"
                    required
                  />
                </div>
              </div>
              <div class="field mt-2">
                <label for="dir-calle">Dirección exacta / Calle y número *</label>
                <input
                  id="dir-calle"
                  v-model="direccionForm.calle"
                  class="input"
                  placeholder="Av. Arce #2140, Edificio…"
                  required
                />
              </div>
              <div class="field mt-2">
                <label for="dir-ref">Referencias adicionales</label>
                <input
                  id="dir-ref"
                  v-model="direccionForm.referencias"
                  class="input"
                  placeholder="Ej. Portón negro frente a la plaza"
                />
              </div>
              <label class="checkbox-inline mt-3">
                <input v-model="direccionForm.predeterminada" type="checkbox" />
                <span>Establecer como dirección predeterminada</span>
              </label>
              <div class="account-form-actions mt-4">
                <button type="submit" class="btn btn-primary btn-sm" :disabled="guardandoDireccion">
                  {{ guardandoDireccion ? 'Guardando…' : 'Guardar Dirección' }}
                </button>
                <button
                  type="button"
                  class="btn btn-tertiary btn-sm"
                  @click="mostrarFormDireccion = false"
                >
                  Cancelar
                </button>
              </div>
            </form>

            <div v-if="direcciones.length" class="address-grid">
              <article
                v-for="dir in direcciones"
                :key="dir.id"
                class="address-card"
                :class="{ 'is-default': dir.predeterminada }"
              >
                <div class="address-card-top">
                  <strong>{{ dir.etiqueta || 'Dirección' }}</strong>
                  <span v-if="dir.predeterminada" class="badge badge-primary">Predeterminada</span>
                </div>
                <p class="address-recipient">{{ dir.nombreDestinatario }}</p>
                <p class="address-line">{{ dir.calle }}</p>
                <p class="address-line">{{ dir.ciudad }} · Tel. {{ dir.telefono }}</p>
                <p v-if="dir.referencias" class="field-hint mt-1">{{ dir.referencias }}</p>
                <div class="address-actions">
                  <button
                    v-if="!dir.predeterminada"
                    type="button"
                    class="btn btn-tertiary btn-sm"
                    @click="establecerDireccionPredeterminada(dir)"
                  >
                    Predeterminar
                  </button>
                  <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    @click="eliminarDireccion(dir)"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            </div>
            <div v-else class="account-empty">
              <AppIcon name="map" :size="36" />
              <h3>Aún no tienes direcciones guardadas</h3>
              <p class="field-hint">Agrega tu casa u oficina para agilizar tus futuras compras.</p>
            </div>
          </section>

          <!-- 4. TARJETAS: Tarjetas asociadas -->
          <section v-else-if="tab === 'tarjetas'" class="card account-panel">
            <div class="account-panel-header flex-between">
              <div>
                <h2>Tarjetas asociadas</h2>
                <p class="field-hint">
                  Tus métodos de pago se almacenan tokenizados mostrando únicamente los últimos 4 dígitos.
                </p>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                @click="mostrarFormTarjeta = !mostrarFormTarjeta"
              >
                {{ mostrarFormTarjeta ? 'Cerrar formulario' : '+ Asociar Tarjeta' }}
              </button>
            </div>

            <form
              v-if="mostrarFormTarjeta"
              class="account-subform mb-5"
              @submit.prevent="asociarTarjeta"
            >
              <h3 class="subform-title">Asociar nueva tarjeta</h3>
              <div class="form-grid-2">
                <div class="field">
                  <label for="card-titular">Titular de la tarjeta *</label>
                  <input
                    id="card-titular"
                    v-model="tarjetaForm.titular"
                    class="input"
                    placeholder="Como figura en la tarjeta"
                    required
                  />
                </div>
                <div class="field">
                  <label for="card-numero">
                    Número de tarjeta *
                    <span v-if="marcaDetectada !== 'Tarjeta'" class="badge ml-1">
                      {{ marcaDetectada }}
                    </span>
                  </label>
                  <input
                    id="card-numero"
                    :value="tarjetaForm.numero"
                    class="input"
                    inputmode="numeric"
                    maxlength="23"
                    placeholder="4532 •••• •••• ••••"
                    required
                    @input="onNumeroTarjetaInput"
                  />
                </div>
              </div>

              <div class="form-grid-3 mt-2">
                <div class="field">
                  <label for="card-mes">Mes (MM) *</label>
                  <select id="card-mes" v-model="tarjetaForm.expiraMes" class="select" required>
                    <option value="">MM</option>
                    <option v-for="m in MESES" :key="m" :value="m">{{ m }}</option>
                  </select>
                </div>
                <div class="field">
                  <label for="card-anio">Año (AA) *</label>
                  <select id="card-anio" v-model="tarjetaForm.expiraAnio" class="select" required>
                    <option value="">AA</option>
                    <option v-for="a in ANIOS" :key="a" :value="a">{{ a }}</option>
                  </select>
                </div>
                <div class="field">
                  <label for="card-cvv">CVV *</label>
                  <input
                    id="card-cvv"
                    v-model="tarjetaForm.cvv"
                    class="input"
                    type="password"
                    inputmode="numeric"
                    maxlength="4"
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <p class="field-hint mt-2">
                El CVV se valida únicamente de forma local y nunca se almacena en nuestros servidores.
              </p>

              <div class="account-form-actions mt-4">
                <button type="submit" class="btn btn-primary btn-sm" :disabled="guardandoTarjeta">
                  {{ guardandoTarjeta ? 'Asociando…' : 'Guardar Tarjeta' }}
                </button>
                <button
                  type="button"
                  class="btn btn-tertiary btn-sm"
                  @click="mostrarFormTarjeta = false"
                >
                  Cancelar
                </button>
              </div>
            </form>

            <div v-if="tarjetas.length" class="credit-cards-grid">
              <article
                v-for="card in tarjetas"
                :key="card.id"
                class="credit-card-visual"
              >
                <div class="credit-card-top">
                  <span class="credit-card-chip" aria-hidden="true"></span>
                  <span class="credit-card-brand">{{ card.marca || 'Tarjeta' }}</span>
                </div>
                <div class="credit-card-number">•••• •••• •••• {{ card.ultimos4 }}</div>
                <div class="credit-card-bottom">
                  <div>
                    <span class="credit-card-label">Titular</span>
                    <p class="credit-card-value">{{ card.titular || userInfo.nombre }}</p>
                  </div>
                  <div>
                    <span class="credit-card-label">Vence</span>
                    <p class="credit-card-value">{{ card.expiraMes }}/{{ card.expiraAnio }}</p>
                  </div>
                </div>
                <div class="credit-card-footer">
                  <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    @click="eliminarTarjeta(card)"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            </div>
            <div v-else class="account-empty">
              <AppIcon name="star" :size="36" />
              <h3>No tienes tarjetas asociadas</h3>
              <p class="field-hint">Asocia una tarjeta de débito o crédito para tus compras.</p>
            </div>
          </section>

          <!-- 5. PASSWORD: Cambio de contraseña -->
          <section v-else-if="tab === 'password'" class="card account-panel">
            <div class="account-panel-header">
              <h2>Cambio de contraseña</h2>
              <p class="field-hint">Usa una contraseña segura de al menos 8 caracteres.</p>
            </div>

            <form class="account-form" @submit.prevent="actualizarPassword">
              <div class="field">
                <label for="pass-actual">Contraseña actual *</label>
                <input
                  id="pass-actual"
                  v-model="passwordForm.passwordActual"
                  class="input"
                  type="password"
                  autocomplete="current-password"
                  required
                />
              </div>

              <div class="form-grid-2">
                <div class="field">
                  <label for="pass-nueva">Nueva contraseña *</label>
                  <input
                    id="pass-nueva"
                    v-model="passwordForm.passwordNueva"
                    class="input"
                    type="password"
                    autocomplete="new-password"
                    minlength="8"
                    required
                  />
                </div>
                <div class="field">
                  <label for="pass-confirmar">Confirmar nueva contraseña *</label>
                  <input
                    id="pass-confirmar"
                    v-model="passwordForm.confirmarPassword"
                    class="input"
                    type="password"
                    autocomplete="new-password"
                    minlength="8"
                    required
                  />
                </div>
              </div>

              <div class="account-form-actions">
                <button type="submit" class="btn btn-primary" :disabled="guardandoPassword">
                  {{ guardandoPassword ? 'Actualizando…' : 'Actualizar Contraseña' }}
                </button>
              </div>
            </form>
          </section>

          <!-- 6. ELIMINAR: Eliminación de cuenta -->
          <section v-else-if="tab === 'eliminar'" class="card account-panel danger-zone-panel">
            <div class="account-panel-header">
              <h2 class="danger-title">Eliminación de cuenta</h2>
              <p class="field-hint">
                Esta acción desactivará permanentemente tu cuenta de cliente y cerrará tu sesión actual.
              </p>
            </div>

            <div class="alert alert-danger mb-4">
              <strong>Zona de peligro:</strong> Una vez eliminada tu cuenta, no podrás volver a iniciar
              sesión con este perfil ni acceder a tus direcciones o tarjetas guardadas.
            </div>

            <form class="account-form" @submit.prevent="eliminarCuenta">
              <div class="field">
                <label for="del-pass">Confirma tu contraseña actual *</label>
                <input
                  id="del-pass"
                  v-model="eliminarForm.password"
                  class="input"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>

              <label class="checkbox-inline mt-2">
                <input v-model="eliminarForm.confirmado" type="checkbox" required />
                <span>
                  Confirmo que deseo eliminar mi cuenta de BytePro de forma definitiva.
                </span>
              </label>

              <div class="account-form-actions mt-4">
                <button
                  type="submit"
                  class="btn btn-danger"
                  :disabled="eliminandoCuenta || !eliminarForm.password || !eliminarForm.confirmado"
                >
                  {{ eliminandoCuenta ? 'Eliminando…' : 'Eliminar mi cuenta definitivamente' }}
                </button>
              </div>
            </form>
          </section>

          <!-- 7. PEDIDOS: Pedidos en curso -->
          <section v-else-if="tab === 'pedidos'" class="card account-panel">
            <div class="account-panel-header flex-between">
              <div>
                <h2>Pedidos en curso</h2>
                <p class="field-hint">Compras confirmadas que están en preparación o en ruta de entrega.</p>
              </div>
              <RouterLink to="/seguimiento" class="btn btn-tertiary btn-sm">
                Ir a Seguimiento
              </RouterLink>
            </div>

            <div v-if="pedidosEnCurso.length" class="orders-stack">
              <article v-for="ped in pedidosEnCurso" :key="ped.id" class="order-summary-card">
                <div class="order-summary-head">
                  <div>
                    <strong class="order-code">{{ ped.numeroPedido }}</strong>
                    <span class="field-hint ml-2">{{ formatDate(ped.fecha) }}</span>
                  </div>
                  <span class="badge" :class="badgeEstadoPedido(ped.estado)">
                    {{ formatEstadoPedido(ped.estado) }}
                  </span>
                </div>

                <div class="order-thumbs-row">
                  <div
                    v-for="(item, idx) in ped.items || []"
                    :key="idx"
                    class="order-mini-item"
                  >
                    <img v-if="item.imagen" :src="item.imagen" :alt="item.producto || 'Producto'" />
                    <span v-else class="order-mini-placeholder">HW</span>
                    <div class="order-mini-info">
                      <span class="order-mini-name">{{ item.producto || 'Producto' }}</span>
                      <span class="field-hint">x{{ item.cantidad }}</span>
                    </div>
                  </div>
                </div>

                <div class="order-summary-foot">
                  <div>
                    <span class="field-hint">Total:</span>
                    <strong class="order-total ml-1">{{ formatPrice(ped.total) }}</strong>
                  </div>
                  <RouterLink
                    :to="
                      ped.codigoSeguimiento
                        ? { name: 'tracking', params: { codigo: ped.codigoSeguimiento } }
                        : { name: 'tracking' }
                    "
                    class="btn btn-primary btn-sm"
                  >
                    Rastrear envío
                  </RouterLink>
                </div>
              </article>
            </div>

            <div v-else class="account-empty">
              <AppIcon name="truck-side" :size="36" />
              <h3>No tienes pedidos en curso</h3>
              <p class="field-hint">Cuando realices una compra podrás seguir cada etapa desde aquí.</p>
              <RouterLink to="/catalogo" class="btn btn-primary btn-sm mt-2">
                Explorar catálogo
              </RouterLink>
            </div>
          </section>

          <!-- 8. HISTORIAL: Historial de pedidos -->
          <section v-else-if="tab === 'historial'" class="card account-panel">
            <div class="account-panel-header flex-between">
              <div>
                <h2>Historial de pedidos</h2>
                <p class="field-hint">Registro de pedidos entregados o cancelados.</p>
              </div>
              <RouterLink to="/mis-pedidos" class="btn btn-tertiary btn-sm">
                Ver detalle completo
              </RouterLink>
            </div>

            <div v-if="pedidosHistorial.length" class="orders-stack">
              <article v-for="ped in pedidosHistorial" :key="ped.id" class="order-summary-card">
                <div class="order-summary-head">
                  <div>
                    <strong class="order-code">{{ ped.numeroPedido }}</strong>
                    <span class="field-hint ml-2">{{ formatDate(ped.fecha) }}</span>
                  </div>
                  <span class="badge" :class="badgeEstadoPedido(ped.estado)">
                    {{ formatEstadoPedido(ped.estado) }}
                  </span>
                </div>

                <div class="order-thumbs-row">
                  <div
                    v-for="(item, idx) in ped.items || []"
                    :key="idx"
                    class="order-mini-item"
                  >
                    <img v-if="item.imagen" :src="item.imagen" :alt="item.producto || 'Producto'" />
                    <span v-else class="order-mini-placeholder">HW</span>
                    <div class="order-mini-info">
                      <span class="order-mini-name">{{ item.producto || 'Producto' }}</span>
                      <span class="field-hint">x{{ item.cantidad }}</span>
                    </div>
                  </div>
                </div>

                <div class="order-summary-foot">
                  <div>
                    <span class="field-hint">Total:</span>
                    <strong class="order-total ml-1">{{ formatPrice(ped.total) }}</strong>
                  </div>
                  <RouterLink to="/mis-pedidos" class="btn btn-tertiary btn-sm">
                    Ver comprobante
                  </RouterLink>
                </div>
              </article>
            </div>

            <div v-else class="account-empty">
              <AppIcon name="cube" :size="36" />
              <h3>Tu historial de pedidos está vacío</h3>
              <p class="field-hint">Tus compras finalizadas o canceladas aparecerán listadas aquí.</p>
            </div>
          </section>

          <!-- 9. RECLAMOS: Historial de reclamos -->
          <section v-else-if="tab === 'reclamos'" class="card account-panel">
            <div class="account-panel-header flex-between">
              <div>
                <h2>Historial de reclamos</h2>
                <p class="field-hint">Seguimiento de consultas, garantías y tickets de soporte.</p>
              </div>
              <RouterLink to="/ayuda" class="btn btn-primary btn-sm">
                Abrir nuevo ticket
              </RouterLink>
            </div>

            <div v-if="reclamos.length" class="claims-stack">
              <article v-for="rec in reclamos" :key="rec.id" class="claim-card">
                <div class="claim-card-head">
                  <div class="claim-card-meta">
                    <strong class="claim-code">{{ rec.codigo || rec.codigoTicket || `TKT-${rec.id}` }}</strong>
                    <span class="badge">{{ rec.tipo || 'SOPORTE' }}</span>
                  </div>
                  <span class="badge" :class="badgeEstadoReclamo(rec.estado)">
                    {{ rec.estado }}
                  </span>
                </div>
                <p class="field-hint mb-2">{{ formatDate(rec.fechaCreacion || rec.createdAt) }}</p>
                <p class="claim-description">{{ rec.descripcion }}</p>
                <div v-if="rec.solucion" class="claim-resolution mt-3">
                  <strong>Notas de resolución:</strong>
                  <p>{{ rec.solucion }}</p>
                </div>
              </article>
            </div>

            <div v-else class="account-empty">
              <AppIcon name="help" :size="36" />
              <h3>No tienes tickets o reclamos registrados</h3>
              <p class="field-hint">¿Necesitas asistencia con una compra o garantía? Contáctanos.</p>
              <RouterLink to="/ayuda" class="btn btn-primary btn-sm mt-2">
                Abrir nuevo ticket
              </RouterLink>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import api, { apiErrorMessage } from '../services/api';
import { useAuthStore } from '../store/auth';
import { useUiStore } from '../store/ui';
import {
  detectBrand,
  formatCardNumber,
  luhnCheck,
  onlyDigits,
  validateCvv,
  validateExpiry,
} from '../utils/card';
import { formatPrice } from '../utils/format';
import { compressImage } from '../utils/imageCompressor';

const tabs = [
  'perfil',
  'correo',
  'direccion',
  'tarjetas',
  'password',
  'eliminar',
  'pedidos',
  'historial',
  'reclamos',
];

const CIUDADES_BOLIVIA = [
  'La Paz',
  'El Alto',
  'Cochabamba',
  'Santa Cruz',
  'Sucre',
  'Oruro',
  'Potosí',
  'Tarija',
  'Trinidad',
  'Cobija',
];

const MESES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const ANIOS = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i).slice(-2));

const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();

const tab = ref('perfil');
const cargando = ref(true);
const avatarInput = ref(null);

const userInfo = reactive({
  id: null,
  username: '',
  email: auth.user?.email || '',
  nombre: auth.user?.nombre || '',
  telefono: auth.user?.telefono || '',
  fotoPerfil: auth.user?.fotoPerfil || '',
});

const direcciones = ref([]);
const tarjetas = ref([]);
const pedidosEnCurso = ref([]);
const pedidosHistorial = ref([]);
const reclamos = ref([]);

const perfilForm = reactive({
  nombre: auth.user?.nombre || '',
  telefono: auth.user?.telefono || '',
  fotoPerfil: auth.user?.fotoPerfil || '',
});
const procesandoImagen = ref(false);
const guardandoPerfil = ref(false);

const correoForm = reactive({
  email: '',
  passwordActual: '',
});
const guardandoCorreo = ref(false);

const mostrarFormDireccion = ref(false);
const guardandoDireccion = ref(false);
const direccionForm = reactive({
  etiqueta: 'Casa',
  nombreDestinatario: auth.user?.nombre || '',
  ciudad: 'La Paz',
  calle: '',
  telefono: auth.user?.telefono || '',
  referencias: '',
  predeterminada: false,
});

const mostrarFormTarjeta = ref(false);
const guardandoTarjeta = ref(false);
const tarjetaForm = reactive({
  titular: auth.user?.nombre || '',
  numero: '',
  expiraMes: '',
  expiraAnio: '',
  cvv: '',
});

const passwordForm = reactive({
  passwordActual: '',
  passwordNueva: '',
  confirmarPassword: '',
});
const guardandoPassword = ref(false);

const eliminarForm = reactive({
  password: '',
  confirmado: false,
});
const eliminandoCuenta = ref(false);

const inicialesUsuario = computed(() => {
  const nombre = (userInfo.nombre || auth.user?.nombre || 'BP').trim();
  const partes = nombre.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  return nombre.slice(0, 2).toUpperCase();
});

const marcaDetectada = computed(() => detectBrand(tarjetaForm.numero));

function setTab(nuevoTab) {
  if (tabs.includes(nuevoTab)) {
    tab.value = nuevoTab;
  }
}

function sincronizarAuthUser(campos) {
  if (!auth.user) return;
  const actualizado = { ...auth.user, ...campos };
  auth.user = actualizado;
  try {
    localStorage.setItem('bytepro_user', JSON.stringify(actualizado));
  } catch {
    // sin acción
  }
}

async function cargarCuenta() {
  cargando.value = true;
  try {
    const { data } = await api.get('/clientes/perfil');
    userInfo.id = data.id;
    userInfo.username = data.username || '';
    userInfo.email = data.email || '';
    userInfo.nombre = data.nombre || '';
    userInfo.telefono = data.telefono || '';
    userInfo.fotoPerfil = data.fotoPerfil || '';

    perfilForm.nombre = data.nombre || '';
    perfilForm.telefono = data.telefono || '';
    perfilForm.fotoPerfil = data.fotoPerfil || '';

    direccionForm.nombreDestinatario = data.nombre || '';
    direccionForm.telefono = data.telefono || '';
    tarjetaForm.titular = data.nombre || '';

    direcciones.value = Array.isArray(data.direcciones) ? data.direcciones : [];
    tarjetas.value = Array.isArray(data.tarjetas) ? data.tarjetas : [];
    pedidosEnCurso.value = Array.isArray(data.pedidos) ? data.pedidos : [];
    pedidosHistorial.value = Array.isArray(data.pedidosHistorial) ? data.pedidosHistorial : [];
    reclamos.value = Array.isArray(data.reclamos) ? data.reclamos : [];

    sincronizarAuthUser({
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      fotoPerfil: data.fotoPerfil,
    });
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    cargando.value = false;
  }
}

async function onFotoSeleccionada(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  procesandoImagen.value = true;
  try {
    const dataUrl = await compressImage(file, {
      maxSide: 480,
      quality: 0.85,
      maxBytes: 220 * 1024,
    });
    perfilForm.fotoPerfil = dataUrl;
  } catch (err) {
    try {
      const reader = new FileReader();
      const fallbackUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Error leyendo imagen'));
        reader.readAsDataURL(file);
      });
      perfilForm.fotoPerfil = fallbackUrl;
    } catch {
      ui.error(err?.message || 'No se pudo cargar la imagen seleccionada');
    }
  } finally {
    procesandoImagen.value = false;
    if (avatarInput.value) avatarInput.value.value = '';
  }
}

function quitarFotoPerfil() {
  perfilForm.fotoPerfil = '';
  if (avatarInput.value) avatarInput.value.value = '';
}

async function guardarPerfil() {
  if (guardandoPerfil.value) return;
  guardandoPerfil.value = true;
  try {
    const { data } = await api.put('/clientes/perfil', {
      nombre: perfilForm.nombre.trim(),
      telefono: (perfilForm.telefono || '').trim() || null,
      fotoPerfil: perfilForm.fotoPerfil || null,
    });
    const perfil = data.perfil || {};
    userInfo.nombre = perfil.nombre || perfilForm.nombre.trim();
    userInfo.telefono = perfil.telefono || '';
    userInfo.fotoPerfil = perfil.fotoPerfil || '';
    sincronizarAuthUser({
      nombre: userInfo.nombre,
      telefono: userInfo.telefono,
      fotoPerfil: userInfo.fotoPerfil,
    });
    ui.success('Perfil actualizado correctamente');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    guardandoPerfil.value = false;
  }
}

async function actualizarCorreo() {
  if (guardandoCorreo.value) return;
  guardandoCorreo.value = true;
  try {
    const { data } = await api.put('/clientes/email', {
      email: correoForm.email.trim(),
      passwordActual: correoForm.passwordActual,
    });
    userInfo.email = data.email || correoForm.email.trim();
    sincronizarAuthUser({ email: userInfo.email });
    correoForm.email = '';
    correoForm.passwordActual = '';
    ui.success('Correo actualizado correctamente');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    guardandoCorreo.value = false;
  }
}

async function agregarDireccion() {
  if (guardandoDireccion.value) return;
  guardandoDireccion.value = true;
  try {
    const { data } = await api.post('/clientes/direcciones', {
      etiqueta: direccionForm.etiqueta.trim() || 'Casa',
      nombreDestinatario: direccionForm.nombreDestinatario.trim(),
      ciudad: direccionForm.ciudad,
      calle: direccionForm.calle.trim(),
      telefono: direccionForm.telefono.trim(),
      referencias: direccionForm.referencias.trim() || null,
      predeterminada: direccionForm.predeterminada,
    });
    if (data.predeterminada) {
      direcciones.value.forEach((d) => {
        d.predeterminada = false;
      });
    }
    direcciones.value.unshift(data);
    direccionForm.calle = '';
    direccionForm.referencias = '';
    direccionForm.predeterminada = false;
    mostrarFormDireccion.value = false;
    ui.success('Dirección agregada correctamente');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    guardandoDireccion.value = false;
  }
}

async function establecerDireccionPredeterminada(dir) {
  try {
    await api.put(`/clientes/direcciones/${dir.id}`, { predeterminada: true });
    direcciones.value.forEach((d) => {
      d.predeterminada = d.id === dir.id;
    });
    ui.success('Dirección predeterminada actualizada');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  }
}

async function eliminarDireccion(dir) {
  const confirmado = await ui.confirm({
    title: 'Eliminar dirección',
    message: `¿Deseas eliminar "${dir.etiqueta || dir.calle}" de tus ubicaciones guardadas?`,
    confirmText: 'Sí, eliminar',
    variant: 'danger',
  });
  if (!confirmado) return;
  try {
    await api.delete(`/clientes/direcciones/${dir.id}`);
    direcciones.value = direcciones.value.filter((d) => d.id !== dir.id);
    ui.success('Dirección eliminada');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  }
}

function onNumeroTarjetaInput(event) {
  tarjetaForm.numero = formatCardNumber(event.target.value);
}

async function asociarTarjeta() {
  if (guardandoTarjeta.value) return;
  const digits = onlyDigits(tarjetaForm.numero);
  if (digits.length < 13 || digits.length > 19 || !luhnCheck(digits)) {
    ui.error('El número de tarjeta no es válido');
    return;
  }
  if (!validateExpiry(tarjetaForm.expiraMes, tarjetaForm.expiraAnio)) {
    ui.error('La fecha de vencimiento es inválida o está expirada');
    return;
  }
  if (!validateCvv(tarjetaForm.cvv)) {
    ui.error('El código CVV debe tener 3 o 4 dígitos');
    return;
  }

  guardandoTarjeta.value = true;
  try {
    const { data } = await api.post('/clientes/tarjetas', {
      titular: tarjetaForm.titular.trim(),
      marca: detectBrand(digits),
      ultimos4: digits.slice(-4),
      expiraMes: tarjetaForm.expiraMes,
      expiraAnio: tarjetaForm.expiraAnio,
    });
    if (Array.isArray(data.items)) {
      tarjetas.value = data.items;
    } else if (data.tarjeta) {
      tarjetas.value.push(data.tarjeta);
    }
    tarjetaForm.numero = '';
    tarjetaForm.expiraMes = '';
    tarjetaForm.expiraAnio = '';
    tarjetaForm.cvv = '';
    mostrarFormTarjeta.value = false;
    ui.success('Tarjeta asociada correctamente');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    guardandoTarjeta.value = false;
  }
}

async function eliminarTarjeta(card) {
  const confirmado = await ui.confirm({
    title: 'Eliminar tarjeta',
    message: `¿Deseas desvincular la tarjeta ${card.marca} terminada en ${card.ultimos4}?`,
    confirmText: 'Sí, desvincular',
    variant: 'danger',
  });
  if (!confirmado) return;
  try {
    await api.delete(`/clientes/tarjetas/${card.id}`);
    tarjetas.value = tarjetas.value.filter((t) => t.id !== card.id);
    ui.success('Tarjeta eliminada');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  }
}

async function actualizarPassword() {
  if (guardandoPassword.value) return;
  if (passwordForm.passwordNueva.length < 8) {
    ui.error('La nueva contraseña debe tener al menos 8 caracteres');
    return;
  }
  if (passwordForm.passwordNueva !== passwordForm.confirmarPassword) {
    ui.error('La nueva contraseña y la confirmación no coinciden');
    return;
  }

  guardandoPassword.value = true;
  try {
    await api.put('/clientes/password', {
      passwordActual: passwordForm.passwordActual,
      passwordNueva: passwordForm.passwordNueva,
      nuevaPassword: passwordForm.passwordNueva,
      confirmarPassword: passwordForm.confirmarPassword,
    });
    passwordForm.passwordActual = '';
    passwordForm.passwordNueva = '';
    passwordForm.confirmarPassword = '';
    ui.success('Contraseña actualizada correctamente');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    guardandoPassword.value = false;
  }
}

async function eliminarCuenta() {
  if (eliminandoCuenta.value || !eliminarForm.password || !eliminarForm.confirmado) return;
  const confirmado = await ui.confirm({
    title: 'Eliminar cuenta definitivamente',
    message:
      '¿Estás completamente seguro de eliminar tu cuenta? Esta acción desactivará tu acceso de forma permanente.',
    confirmText: 'Sí, eliminar cuenta',
    variant: 'danger',
  });
  if (!confirmado) return;

  eliminandoCuenta.value = true;
  try {
    await api.delete('/clientes/cuenta', {
      data: { password: eliminarForm.password },
    });
    auth.logout();
    ui.success('Tu cuenta ha sido eliminada correctamente');
    router.push('/');
  } catch (err) {
    ui.error(apiErrorMessage(err));
  } finally {
    eliminandoCuenta.value = false;
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatEstadoPedido(estado) {
  const mapa = {
    PEDIDO_CONFIRMADO: 'Confirmado',
    EN_PREPARACION: 'En preparación',
    EN_CAMINO: 'En camino',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
  };
  return mapa[estado] || estado;
}

function badgeEstadoPedido(estado) {
  if (estado === 'ENTREGADO') return 'badge-success';
  if (estado === 'CANCELADO') return 'badge-danger';
  if (estado === 'EN_CAMINO') return 'badge-primary';
  return 'badge-warning';
}

function badgeEstadoReclamo(estado) {
  if (estado === 'RESUELTO' || estado === 'CERRADO') return 'badge-success';
  if (estado === 'EN_PROCESO') return 'badge-primary';
  return 'badge-warning';
}

onMounted(() => {
  const queryTab = String(route.query.tab || '').trim();
  if (queryTab && tabs.includes(queryTab)) {
    tab.value = queryTab;
  }
  cargarCuenta();
});
</script>

<style scoped>
.account-page {
  padding-top: var(--space-6);
  padding-bottom: var(--space-10);
}

.account-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-6);
  flex-wrap: wrap;
}

.account-hero-user {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.account-hero-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--color-primary-soft, #dbeafe);
  color: var(--color-primary-dark, #1d4ed8);
  display: grid;
  place-items: center;
  font-size: 1.35rem;
  font-weight: 700;
  overflow: hidden;
  border: 2px solid var(--color-primary, #2563eb);
  flex-shrink: 0;
}

.account-hero-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.account-eyebrow {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-primary);
}

.account-hero-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 2px 0;
  color: var(--color-text);
}

.account-hero-email {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.account-hero-stats {
  display: flex;
  gap: var(--space-6);
}

.account-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 72px;
}

.account-stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
}

.account-stat-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.account-layout {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: var(--space-6);
  align-items: start;
}

.account-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.account-nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-nav-group-danger {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-3);
}

.account-nav-heading {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  padding: 0 var(--space-3) 4px;
}

.account-nav-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-pill, 9999px);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.account-nav-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.account-nav-label {
  flex: 1;
  text-align: left;
}

.account-nav-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.account-nav-btn.active {
  background: var(--color-primary-soft, #dbeafe);
  color: var(--color-primary-dark, #1d4ed8);
  font-weight: 600;
}

.account-nav-btn-danger {
  color: #dc2626;
}

.account-nav-btn-danger:hover,
.account-nav-btn-danger.active {
  background: #fee2e2;
  color: #b91c1c;
}

.account-panel {
  padding: var(--space-6);
}

.account-panel-header {
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.account-panel-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.profile-avatar-editor {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex-wrap: wrap;
}

.profile-avatar-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--color-bg-muted);
  border: 2px solid var(--color-border-strong);
  display: grid;
  place-items: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  overflow: hidden;
  flex-shrink: 0;
}

.profile-avatar-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-avatar-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.profile-avatar-controls .field-hint {
  flex-basis: 100%;
  margin: 0;
}

.avatar-upload-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.account-form-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.account-subform {
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl, 16px);
  padding: var(--space-5);
}

.subform-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: var(--space-3);
}

.checkbox-inline {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  cursor: pointer;
}

.address-grid,
.credit-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.address-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl, 16px);
  padding: var(--space-4);
  background: var(--color-white);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.address-card.is-default {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary-soft);
}

.address-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.address-recipient {
  font-weight: 600;
  font-size: 14px;
}

.address-line {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.address-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-3);
}

.credit-card-visual {
  border-radius: var(--radius-xl, 16px);
  padding: var(--space-5);
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
}

.credit-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.credit-card-chip {
  width: 34px;
  height: 24px;
  border-radius: 5px;
  background: linear-gradient(135deg, #fde047, #ca8a04);
}

.credit-card-brand {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.credit-card-number {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.15rem;
  letter-spacing: 0.12em;
  margin: var(--space-1) 0;
}

.credit-card-bottom {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.credit-card-label {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.75;
}

.credit-card-value {
  font-size: 13px;
  font-weight: 600;
}

.credit-card-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-2);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.danger-zone-panel {
  border: 1px solid #fecaca;
}

.danger-title {
  color: #dc2626;
}

.orders-stack,
.claims-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.order-summary-card,
.claim-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl, 16px);
  padding: var(--space-4);
  background: var(--color-white);
}

.order-summary-head,
.claim-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-3);
}

.claim-card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.order-code,
.claim-code {
  font-size: 15px;
  font-weight: 700;
}

.order-thumbs-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.order-mini-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.order-mini-item img,
.order-mini-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.order-mini-info {
  display: flex;
  flex-direction: column;
}

.order-mini-name {
  font-size: 13px;
  font-weight: 600;
}

.order-summary-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  gap: var(--space-3);
}

.order-total {
  font-size: 1rem;
  color: var(--color-text);
}

.claim-description {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.5;
}

.claim-resolution {
  background: var(--color-bg-muted);
  border-left: 3px solid var(--color-primary);
  padding: var(--space-3);
  border-radius: 8px;
  font-size: 13px;
}

.account-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8) var(--space-4);
  gap: var(--space-2);
  color: var(--color-text-secondary);
}

.account-empty h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.badge-primary {
  background: var(--color-primary-soft, #dbeafe);
  color: var(--color-primary-dark, #1d4ed8);
}

.badge-success {
  background: #dcfce7;
  color: #166534;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-danger {
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 960px) {
  .account-layout {
    grid-template-columns: 1fr;
  }

  .account-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: var(--space-2);
    padding: var(--space-3);
  }

  .account-nav-group {
    flex-direction: row;
    flex-shrink: 0;
  }

  .account-nav-group-danger {
    border-top: none;
    border-left: 1px solid var(--color-border);
    padding-top: 0;
    padding-left: var(--space-2);
  }

  .account-nav-heading {
    display: none;
  }

  .account-nav-btn {
    white-space: nowrap;
  }
}

@media (max-width: 680px) {
  .form-grid-2,
  .form-grid-3,
  .address-grid,
  .credit-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
