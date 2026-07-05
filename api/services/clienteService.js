import clienteRepository from "../repositories/clienteRepository.js";

class ClienteService {
  async obtenerTodos(restauranteId) {
    return clienteRepository.obtenerTodos(restauranteId);
  }

  async obtenerPorId(id, restauranteId) {
    return clienteRepository.obtenerPorId(id, restauranteId);
  }

  async crear(datos, restauranteId) {
    return clienteRepository.crear(this.#convertirEntrada(datos), restauranteId);
  }

  async actualizar(id, datos, restauranteId) {
    return clienteRepository.actualizar(id, this.#convertirEntrada(datos), restauranteId);
  }

  async eliminar(id, restauranteId) {
    return clienteRepository.actualizar(id, { activo: false }, restauranteId);
  }

  async buscarPorNombre(nombre, restauranteId) {
    return clienteRepository.buscarPorNombre(nombre, restauranteId);
  }

  async importarContactosCsv(csv, restauranteId) {
    if (!csv || typeof csv !== "string") {
      throw new Error("Debe enviar un archivo CSV valido");
    }

    const filas = this.#parseCsv(csv);
    if (filas.length < 2) {
      throw new Error("El CSV no tiene contactos para importar");
    }

    const headers = filas[0].map((header) => this.#normalizarHeader(header));
    const resultado = {
      totalLeidos: Math.max(0, filas.length - 1),
      importados: 0,
      duplicados: 0,
      invalidos: 0,
      clientes: []
    };

    for (const fila of filas.slice(1)) {
      const contacto = this.#contactoDesdeFila(headers, fila);
      if (!contacto.nombre || (!contacto.telefono && !contacto.email)) {
        resultado.invalidos += 1;
        continue;
      }

      const duplicado = await clienteRepository.buscarDuplicado(contacto, restauranteId);
      if (duplicado) {
        resultado.duplicados += 1;
        continue;
      }

      const creado = await clienteRepository.crear(contacto, restauranteId);
      resultado.importados += 1;
      resultado.clientes.push(creado);
    }

    return resultado;
  }

  #convertirEntrada(datos) {
    const { confirmarEmail, confirmarTelefono, ...resto } = datos;
    return resto;
  }

  #parseCsv(csv) {
    const filas = [];
    let fila = [];
    let campo = "";
    let enComillas = false;

    for (let i = 0; i < csv.length; i += 1) {
      const char = csv[i];
      const next = csv[i + 1];

      if (char === "\"" && enComillas && next === "\"") {
        campo += "\"";
        i += 1;
        continue;
      }

      if (char === "\"") {
        enComillas = !enComillas;
        continue;
      }

      if (char === "," && !enComillas) {
        fila.push(campo);
        campo = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !enComillas) {
        if (char === "\r" && next === "\n") i += 1;
        fila.push(campo);
        if (fila.some((value) => value.trim())) {
          filas.push(fila);
        }
        fila = [];
        campo = "";
        continue;
      }

      campo += char;
    }

    fila.push(campo);
    if (fila.some((value) => value.trim())) {
      filas.push(fila);
    }

    return filas;
  }

  #normalizarHeader(header) {
    return String(header || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  #valor(headers, fila, nombres) {
    for (const nombre of nombres) {
      const index = headers.indexOf(nombre);
      if (index !== -1 && fila[index]?.trim()) {
        return fila[index].trim();
      }
    }
    return "";
  }

  #contactoDesdeFila(headers, fila) {
    const nombreCompleto = this.#valor(headers, fila, ["name", "nombre", "full name"]);
    const nombre = this.#valor(headers, fila, ["given name", "first name", "nombre pila", "nombre"]) || nombreCompleto.split(" ")[0] || "";
    const apellido = this.#valor(headers, fila, ["family name", "last name", "apellido"]) || nombreCompleto.split(" ").slice(1).join(" ") || "-";
    const telefono = this.#limpiarTelefono(this.#valor(headers, fila, ["phone 1 - value", "telefono", "phone", "mobile phone", "home phone"]));
    const email = this.#limpiarEmail(this.#valor(headers, fila, ["e-mail 1 - value", "email", "correo", "e-mail address"]));
    const direccion = this.#valor(headers, fila, ["address 1 - formatted", "direccion", "address", "home address"]);

    return {
      nombre: nombre || nombreCompleto || "Sin nombre",
      apellido: apellido || "-",
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      activo: true
    };
  }

  #limpiarTelefono(telefono) {
    return String(telefono || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  #limpiarEmail(email) {
    const limpio = String(email || "").trim().toLowerCase();
    return limpio.includes("@") ? limpio : "";
  }
}

export default new ClienteService();
