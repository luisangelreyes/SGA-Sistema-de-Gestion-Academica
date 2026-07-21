import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { alumnosService } from '../services/alumnos.service';
import { gruposService } from '../services/grupos.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlumnoResumen {
  id: number;
  nombre: string;
  matricula?: string;
  curp?: string;
  nivel?: string;
  turno?: string;
  grado?: string | number;
  grupoActual?: string;
  grupo?: { nombre?: string; codigo?: string; cct?: string; grado?: string | number, docenteTitular?: { nombreCompleto?: string } };
}

interface Calificacion {
  nombre: string;
  T1: { v: string };
  T2: { v: string };
  T3: { v: string };
  prom?: string;
}

async function exportarBoletaPDF(
  alumno: AlumnoResumen,
  calificaciones: Calificacion[],
  promedioGeneral: string
) {
  const nivel = (alumno.nivel || 'PRIMARIA').toUpperCase();
  const nombre = alumno.nombre || 'N/A';
  const curp = alumno.curp || '';
  const matricula = alumno.matricula || '';
  const grado = String(alumno.grado || alumno.grupo?.grado || '');
  const grupoNombre = alumno.grupoActual || alumno.grupo?.nombre || alumno.grupo?.codigo || '';
  const turno = alumno.turno || 'MATUTINO';
  const ctt = alumno.grupo?.cct || '30PPR3773B';
  const docente = alumno.grupo?.docenteTitular?.nombreCompleto || 'MARIA J. GALINDO TOME';

  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = String(hoy.getFullYear()).slice(-2);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW = 215.9, M = 15;
  let y = M;

  try {
    const img = new Image();
    img.src = '/escudo.png';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    doc.addImage(img, 'PNG', 20, 15, 25, 32);
  } catch (e) {
    console.log('No se pudo cargar el escudo', e);
  }

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('CENTRO DE INVESTIGACIÓN EDUCATIVA COLEGIO SAN DIEGO', PW/2, y + 5, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Punta el Campanario #183 Col. Bahía de San Martín', PW/2, y + 11, { align: 'center' });
  doc.text(`Nivel ${nivel.charAt(0).toUpperCase() + nivel.slice(1).toLowerCase()}`, PW/2, y + 17, { align: 'center' });
  doc.text(ctt, PW/2, y + 23, { align: 'center' });

  y += 35;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('BOLETA INTERNA DE CALIFICACIONES', PW/2, y, { align: 'center' });
  y += 8;

  const boxHeight = 22;
  doc.setLineWidth(0.5);
  doc.rect(M, y, PW - 2*M, boxHeight);
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Nombre del (de la) alumno (a):', M + 2, y + 6);
  
  const partesNombre = nombre.trim().split(' ');
  let ape1 = '', ape2 = '', nombres = '';
  if (partesNombre.length === 2) {
    nombres = partesNombre[0];
    ape1 = partesNombre[1];
  } else if (partesNombre.length >= 3) {
    ape2 = partesNombre.pop() || '';
    ape1 = partesNombre.pop() || '';
    nombres = partesNombre.join(' ');
  } else {
    nombres = nombre;
  }

  // Secciones de Nombre:
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text(ape1.substring(0, 25), M + 62.5, y + 5.5, { align: 'center' });
  doc.text(ape2.substring(0, 25), M + 99.5, y + 5.5, { align: 'center' });
  doc.text(nombres.substring(0, 25), M + 136.5, y + 5.5, { align: 'center' });
  
  doc.setLineWidth(0.2);
  doc.line(M + 45, y + 7, M + 80, y + 7);
  doc.line(M + 82, y + 7, M + 117, y + 7);
  doc.line(M + 119, y + 7, M + 154, y + 7);

  doc.setFontSize(6);
  doc.setFont(undefined, 'normal');
  doc.text('PRIMER APELLIDO', M + 62.5, y + 10, { align: 'center' });
  doc.text('SEGUNDO APELLIDO', M + 99.5, y + 10, { align: 'center' });
  doc.text('NOMBRE(S)', M + 136.5, y + 10, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Grado y Grupo:', M + 152, y + 6);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  const letraGrupo = grupoNombre.match(/[A-Z]/)?.[0] || '';
  let textoGrado = `${grado} ${letraGrupo}`.trim();
  doc.text(textoGrado, M + 177.9, y + 5.5, { align: 'center' });
  doc.line(M + 170, y + 7, PW - M, y + 7);

  // Linea 2 (CURP, Turno, CTT)
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('CURP', M + 5, y + 18);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text(curp, M + 35, y + 17.5, { align: 'center' });
  doc.line(M + 15, y + 19, M + 55, y + 19);

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Turno:', M + 58, y + 18);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text(turno, M + 85, y + 17.5, { align: 'center' });
  doc.line(M + 70, y + 19, M + 100, y + 19);

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('CTT', M + 105, y + 18);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text(ctt, M + 145, y + 17.5, { align: 'center' });
  doc.line(M + 115, y + 19, PW - M - 20, y + 19);

  y += boxHeight + 8;

  const col1 = 45; 
  const colTrim = 28; 
  const colProm = 20; 
  const sideW = 35; 

  const drawCell = (x: number, y: number, w: number, h: number, text: string, isBlue = false, isBold = false) => {
    if (isBlue) {
      doc.setFillColor(143, 172, 220); 
      doc.rect(x, y, w, h, 'F');
    }
    doc.setLineWidth(0.5);
    doc.rect(x, y, w, h);
    doc.setFontSize(8);
    doc.setFont(undefined, isBold ? 'bold' : 'normal');
    doc.setTextColor(0, 0, 0);
    // Limitar el string para que no rebase, o hacer un split basico si es muy largo
    const printText = text.length > 25 ? text.substring(0, 25) : text;
    doc.text(printText, x + w / 2, y + h / 2 + 1, { align: 'center', baseline: 'middle' });
  };

  const drawDoubleCell = (x: number, y: number, w: number, h: number, text1: string, text2: string, isBlue = false) => {
    doc.setLineWidth(0.5);
    if(isBlue) doc.setFillColor(143, 172, 220);
    doc.rect(x, y, w, h, isBlue ? 'FD' : 'S');
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(text1, x + w / 2, y + h / 4 + 1, { align: 'center', baseline: 'middle' });
    doc.text(text2, x + w / 2, y + h * 0.75 + 1, { align: 'center', baseline: 'middle' });
    doc.line(x, y + h/2, x + w, y + h/2);
  };

  const tableStartY = y;
  const headerH = 12;
  drawCell(M, y, col1, headerH, 'ASIGNATURAS', true, true);
  drawDoubleCell(M + col1, y, colTrim, headerH, '1er. Trimestre', 'Calificación', true);
  drawDoubleCell(M + col1 + colTrim, y, colTrim, headerH, '2do. Trimestre', 'Calificación', true);
  drawDoubleCell(M + col1 + colTrim * 2, y, colTrim, headerH, '3er. Trimestre', 'Calificación', true);
  drawDoubleCell(M + col1 + colTrim * 3, y, colProm, headerH, 'Promedio', 'Final', true);

  const tableW = col1 + colTrim * 3 + colProm;
  const sideX = M + tableW + 5;
  drawDoubleCell(sideX, y, sideW, 8, 'FIRMA DEL PADRE DE', 'FAMILIA O TUTOR', true);
  doc.rect(sideX, y + 8, sideW, 18); doc.setFontSize(7); doc.setFont(undefined, 'bold'); doc.text('1er. Periodo', sideX + 2, y + 12);
  doc.rect(sideX, y + 26, sideW, 18); doc.text('2do. Periodo', sideX + 2, y + 30);
  doc.rect(sideX, y + 44, sideW, 18); doc.text('3er. Periodo', sideX + 2, y + 48);

  y += headerH;
  const rowH = 9;
  calificaciones.forEach((mat) => {
    drawCell(M, y, col1, rowH, mat.nombre.toUpperCase(), false, false);
    drawCell(M + col1, y, colTrim, rowH, mat.T1.v || '', false, false);
    drawCell(M + col1 + colTrim, y, colTrim, rowH, mat.T2.v || '', false, false);
    drawCell(M + col1 + colTrim * 2, y, colTrim, rowH, mat.T3.v || '', false, false);
    drawCell(M + col1 + colTrim * 3, y, colProm, rowH, mat.prom || '', false, true);
    y += rowH;
  });

  const finalBoxY = Math.max(y, tableStartY + 62 + 5);
  drawDoubleCell(sideX, finalBoxY, sideW, 8, 'PROMEDIO FINAL', 'DE GRADO', true);
  doc.rect(sideX, finalBoxY + 8, sideW, 10);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(promedioGeneral, sideX + sideW / 2, finalBoxY + 14, { align: 'center', baseline: 'middle' });

  y = Math.max(y, finalBoxY + 18) + 15;
  const boxW = 100;
  doc.rect(M + 15, y, boxW, 35);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text(docente.toUpperCase(), M + 15 + boxW / 2, y + 20, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(M + 25, y + 22, M + 15 + boxW - 10, y + 22);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('NOMBRE Y FIRMA DEL DOCENTE', M + 15 + boxW / 2, y + 25, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('COATZACOALCOS, VERACRUZ', M + 15 + boxW / 2, y + 30, { align: 'center' });
  doc.setFontSize(7);
  doc.text('LUGAR DE EXPEDICIÓN', M + 15 + boxW / 2, y + 33, { align: 'center' });

  const dateX = PW - M - 40;
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('DÍA     MES     AÑO', dateX + 17, y + 20, { align: 'center' });
  doc.rect(dateX, y + 22, 10, 6); doc.text(dia, dateX + 5, y + 26, { align: 'center' });
  doc.rect(dateX + 12, y + 22, 10, 6); doc.text(mes, dateX + 17, y + 26, { align: 'center' });
  doc.rect(dateX + 24, y + 22, 10, 6); doc.text(anio, dateX + 29, y + 26, { align: 'center' });
  doc.setLineWidth(1.5);
  doc.line(dateX, y + 28, dateX + 34, y + 28);
  doc.setFontSize(7);
  doc.text('FECHA DE EXPEDICIÓN', dateX + 17, y + 32, { align: 'center' });

  doc.save(`Boleta_${nivel}_${matricula}.pdf`);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Boleta() {
  const [listaAlumnos, setListaAlumnos] = useState<AlumnoResumen[]>([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<AlumnoResumen | null>(null);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [promedioGeneral, setPromedioGeneral] = useState('-');
  const [loadingCals, setLoadingCals] = useState(false);
  const [generando, setGenerando] = useState(false);

  const nivelesDisponibles = ['PREESCOLAR', 'PRIMARIA', 'SECUNDARIA', 'BACHILLERATO'];

  // Cargar alumnos
  useEffect(() => {
    const fetchAlumnos = async () => {
      setLoadingLista(true);
      try {
        const res: any = await alumnosService.getAlumnos({ limit: 500 });
        const data = res.data?.data || res.data || [];
        setListaAlumnos(Array.isArray(data) ? data : data.alumnos ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLista(false);
      }
    };
    fetchAlumnos();
  }, []);

  const resultados = listaAlumnos.filter((al) => {
    const q = busqueda.trim().toLowerCase();
    const matchQ = !q || al.nombre.toLowerCase().includes(q) || (al.matricula?.toLowerCase().includes(q) ?? false);
    const matchN = !filtroNivel || (al.nivel?.toUpperCase() === filtroNivel);
    return matchQ && matchN;
  });

  // Seleccionar alumno y cargar sus calificaciones del último ciclo
  const seleccionar = async (al: AlumnoResumen) => {
    setAlumnoSeleccionado(al);
    setCalificaciones([]);
    setPromedioGeneral('-');
    setLoadingCals(true);
    try {
      const idA = al.id || (al as any).alumnoId;
      
      // Fetch historial
      const res: any = await alumnosService.obtenerHistorialAcademico(idA);
      const payload = res.data ?? res;
      const historial = payload.historial ?? payload;

      // Intentar obtener el tutor directamente de gruposService por si falla el mapeo del backend
      try {
        const idG = (al as any).grupoId || (al.grupo as any)?.id || (al.grupo as any)?.grupoId;
        if (idG) {
          const resG: any = await gruposService.obtenerPorId(idG);
          const grupoReal = resG.data?.data || resG.data;
          if (grupoReal && grupoReal.titular) {
            al.grupo = al.grupo || {};
            al.grupo.docenteTitular = { nombreCompleto: grupoReal.titular };
          }
        }
      } catch (errG) {
        console.error('Error cargando grupo:', errG);
      }

      if (Array.isArray(historial) && historial.length > 0) {
        // Tomar el ciclo más reciente
        const ultimoCiclo = historial[historial.length - 1];
        const curriculares = ultimoCiclo?.curriculares ?? [];

        // Agrupar por materia → T1, T2, T3
        const matMap: Record<string, any> = {};
        curriculares.forEach((c: any) => {
          if (!matMap[c.materia]) {
            matMap[c.materia] = { nombre: c.materia, T1: { v: '' }, T2: { v: '' }, T3: { v: '' } };
          }
          const periodo = c.periodoNombre || c.periodo || '';
          if (/1|primer/i.test(periodo)) matMap[c.materia].T1.v = String(c.valorNumerico ?? c.valorCualitativo ?? '');
          else if (/2|segundo/i.test(periodo)) matMap[c.materia].T2.v = String(c.valorNumerico ?? c.valorCualitativo ?? '');
          else if (/3|tercer/i.test(periodo)) matMap[c.materia].T3.v = String(c.valorNumerico ?? c.valorCualitativo ?? '');
          else matMap[c.materia].T1.v = String(c.valorNumerico ?? c.valorCualitativo ?? '');
        });

        const cals: Calificacion[] = Object.values(matMap).map((m: any) => {
          const vals = [m.T1.v, m.T2.v, m.T3.v]
            .map(Number)
            .filter((n) => !isNaN(n) && n > 0);
          const prom = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '-';
          return { ...m, prom };
        });

        setCalificaciones(cals);

        const todos = cals.map((c) => parseFloat(c.prom ?? '')).filter((n) => !isNaN(n));
        setPromedioGeneral(
          todos.length > 0 ? (todos.reduce((a, b) => a + b, 0) / todos.length).toFixed(1) : '-'
        );
      }
    } catch (err) {
      console.error('Error cargando calificaciones:', err);
    } finally {
      setLoadingCals(false);
    }
  };

  const volver = () => {
    setAlumnoSeleccionado(null);
    setCalificaciones([]);
  };

  const generarPDF = async () => {
    if (!alumnoSeleccionado) return;
    setGenerando(true);
    try {
      await exportarBoletaPDF(alumnoSeleccionado, calificaciones, promedioGeneral);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerando(false);
    }
  };

  // ── Vista: lista ──────────────────────────────────────────────────────────
  if (!alumnoSeleccionado) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Generación de Boletas</h2>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona un alumno para generar su boleta de calificaciones en PDF.
          </p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Buscar alumno</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre o matrícula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nivel</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
            >
              <option value="">Todos los niveles</option>
              {nivelesDisponibles.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loadingLista ? (
            <div className="p-8 text-center text-gray-500">Cargando alumnos...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700">Alumno</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Nivel</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Grado / Grupo</th>
                  <th className="p-3 text-right font-semibold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {resultados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No se encontraron alumnos.
                    </td>
                  </tr>
                ) : (
                  resultados.map((al) => (
                    <tr key={al.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{al.nombre}</div>
                        <div className="text-xs text-gray-500">Mat: {al.matricula || 'S/M'}</div>
                      </td>
                      <td className="p-3 text-gray-700">{al.nivel || 'N/A'}</td>
                      <td className="p-3 text-gray-700">
                        {al.grado ? `${al.grado}° ` : ''}{al.grupoActual || ''}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => seleccionar(al)}
                          className="flex items-center gap-1.5 ml-auto px-3 py-1 text-xs border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Generar Boleta
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ── Vista: previsualización y generación ────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <button
          onClick={volver}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la lista
        </button>
        <button
          onClick={generarPDF}
          disabled={generando || loadingCals || calificaciones.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          {generando ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      {/* Info alumno */}
      <div className="bg-blue-900 text-white rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-white/60 text-xs font-semibold uppercase mb-1">Alumno</div>
            <div className="font-bold">{alumnoSeleccionado.nombre}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs font-semibold uppercase mb-1">Matrícula</div>
            <div>{alumnoSeleccionado.matricula || 'S/M'}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs font-semibold uppercase mb-1">Nivel</div>
            <div>{alumnoSeleccionado.nivel || 'N/A'}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs font-semibold uppercase mb-1">Promedio General</div>
            <div className="text-2xl font-bold">{promedioGeneral}</div>
          </div>
        </div>
      </div>

      {/* Tabla de calificaciones (previsualización) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Calificaciones — Ciclo Actual</h3>
        </div>
        {loadingCals ? (
          <div className="p-8 text-center text-gray-500">Cargando calificaciones...</div>
        ) : calificaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay calificaciones registradas para este alumno.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700">Asignatura</th>
                <th className="p-3 text-center font-semibold text-gray-700">1er Trimestre</th>
                <th className="p-3 text-center font-semibold text-gray-700">2do Trimestre</th>
                <th className="p-3 text-center font-semibold text-gray-700">3er Trimestre</th>
                <th className="p-3 text-center font-semibold text-gray-700">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {calificaciones.map((c, i) => {
                const low = c.prom && c.prom !== '-' && parseFloat(c.prom) < 6;
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{c.nombre}</td>
                    <td className="p-3 text-center text-gray-700">{c.T1.v || '-'}</td>
                    <td className="p-3 text-center text-gray-700">{c.T2.v || '-'}</td>
                    <td className="p-3 text-center text-gray-700">{c.T3.v || '-'}</td>
                    <td className={`p-3 text-center font-bold ${low ? 'text-red-600' : 'text-emerald-700'}`}>
                      {c.prom || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        La boleta se descarga automáticamente en PDF al hacer clic en "Descargar PDF".
      </p>
    </div>
  );
}
