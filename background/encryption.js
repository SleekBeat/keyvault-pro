export class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12;
    this.saltLength = 16;
    this.iterations = 100000;
  }

  /**
   * Derive encryption key from master password using PBKDF2
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data with master password
   */
  async encryptData(data, password) {
    try {
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      const key = await this.deriveKey(password, salt);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: this.algorithm, iv: iv },
        key,
        encoder.encode(data)
      );

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      return this.arrayBufferToBase64(combined);
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data with master password
   */
  async decryptData(encryptedBase64, password) {
    try {
      const combined = this.base64ToArrayBuffer(encryptedBase64);
      
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const encryptedData = combined.slice(this.saltLength + this.ivLength);

      const key = await this.deriveKey(password, salt);

      const decryptedData = await crypto.subtle.decrypt(
        { name: this.algorithm, iv: iv },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash master password for verification
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
    
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      256
    );

    const combined = new Uint8Array(salt.length + hashBits.byteLength);
    combined.set(salt, 0);
    combined.set(new Uint8Array(hashBits), salt.length);

    return this.arrayBufferToBase64(combined);
  }

  /**
   * Verify master password against stored hash
   */
  async verifyMasterPassword(password) {
    try {
      const stored = await this.getStoredPasswordHash();
      if (!stored) {
        // First time setup - create hash
        const hash = await this.hashPassword(password);
        await this.storePasswordHash(hash);
        return true;
      }

      const combined = this.base64ToArrayBuffer(stored);
      const salt = combined.slice(0, this.saltLength);
      const storedHash = combined.slice(this.saltLength);

      const encoder = new TextEncoder();
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const hashBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.iterations,
          hash: 'SHA-256'
        },
        passwordKey,
        256
      );

      const computedHash = new Uint8Array(hashBits);
      
      // Constant-time comparison
      return this.constantTimeEqual(storedHash, computedHash);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  constantTimeEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    
    return result === 0;
  }

  /**
   * Store password hash in chrome storage
   */
  async storePasswordHash(hash) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ passwordHash: hash }, resolve);
    });
  }

  /**
   * Get stored password hash
   */
  async getStoredPasswordHash() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['passwordHash'], (result) => {
        resolve(result.passwordHash || null);
      });
    });
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Generate random encryption key
   */
  generateRandomKey(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array);
  }
}

