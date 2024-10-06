#!/usr/bin/python3


import random
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
from matplotlib import backends
from matplotlib.backends import backend_pdf
from matplotlib import rcParams
from matplotlib import colors
import scipy.special as spsp
import math
import scipy.optimize as spopt
matplotlib.rcParams.update(matplotlib.rcParamsDefault)
rcParams['text.usetex'] = True
rcParams['font.family'] = 'serif'
rcParams['font.sans-serif'] = ['CMU Serif']
rcParams['font.serif'] = ['CMU Serif']
plt.rc('text.latex', preamble=r'\usepackage{amsmath}\usepackage{amssymb}')

##### DATA ######

# FORMAT: [DyP, M, F, Fx, Fy, Fz, Shr, ShrX, ShrY, ShrZ]
# UNITÉS: [Pa,  #, N, ->          Pa, ->               ]



f = {
	"DyP" : 0,
	"M" : 1,
	"F": 2,
	"Fx" : 3,
	"Fy" : 4,
	"Fz" : 5,
	"Shr" : 6,
	"ShrX" : 7,
	"ShrY" : 8,
	"ShrZ" : 9,
}

f_kwd = {
	"DyP" : "GG Average Dynamic Pressure 1",
	"M" : 'GG Average Mach Number 2',
	"F": 'GG Force 3',
	"Fx" : 'GG Force (X) 4',
	"Fy" : 'GG Force (Y) 5',
	"Fz" : 'GG Force (Z) 6',
	"Shr" : 'GG Average Shear Stress 7',
	"ShrX" : 'GG Average Shear Stress (X) 8',
	"ShrY" : 'GG Average Shear Stress (Y) 9',
	"ShrZ" : 'GG Average Shear Stress (Z) 10',
}
def importDataCSV(path):
	raw = np.loadtxt(path,dtype='str',delimiter=',')
	psd_avg = []
	psd_err = []
	for i in range(len(f_kwd.keys())):
		i += 1
		#print("proceeding for " + str(list(f_kwd.keys())[i-1]))
		psd_avg.append(float(raw[i][3]))
		psd_err.append(0.5*np.abs(float(raw[i][5])-float(raw[i][4])))
		#print(i)
		#print(len(psd_avg))
	#print("returning two arrays of sizes " + str(len(psd_avg)) + ", " + str(len(psd_err)))
	return np.array(psd_avg), np.array(psd_err)

header = "../../dat/csv/"
t = {
	"new" : 1,
	"old" : 2
}
m = {
	"0p5": 1,
	"1": 2,
	"1p5": 3,
	"2" : 4
}
mFLT = {
	"0p5": 0.5,
	"1": 1,
	"1p5": 1.5,
	"2" : 2
}
types = t.keys()
machs = m.keys()
end = ".csv"
lFs = []
lID = []
ctr1 = 0
ctr2 = 0
for i in types:
	ctr1 += 1
	ctr2 = 0
	for j in machs:
		ctr2 += 1
		lFs.append(header + i + "_" + j + end)
		lID.append(ctr1*10+ctr2)
		#print("Parsed file " + header + i + "_" + j + end)
		#print("Saving with identifier " + str(lID[-1]))

d = {}
de = {}
for i in range(len(lID)):
	d[lID[i]],de[lID[i]] = importDataCSV(lFs[i])

# d conține datele.

def getInfo_str(modelSTR,speedSTR,paramSTR):
	#print("req:")
	#print(modelSTR)
	#print(speedSTR)
	#print(paramSTR)
	#print("ID: " + str(t[modelSTR]*10+m[speedSTR]))
	#print("place: " + str(f[paramSTR]))
	#print("inter: " + str(d[t[modelSTR]*10+m[speedSTR]]))
	return np.abs(d[t[modelSTR]*10+m[speedSTR]][f[paramSTR]])

def getInfo_int(modelINT,speedINT,paramINT):
	return d[modelINT*10+speedINT][paramINT]

# demonstrator: Fx of 1p5 new:
#val = getInfo_str("new","1p5","Fx")
#print(val)



###### TABLE GEN ######

# TODO: pentru fiecare viteză (0p5 -> 2), 
# tabelă comparând cele două modele (new, old) 
# pentru caracteristicile următoare:

"""
	"DyP" : "GG Average Dynamic Pressure 1",
	"M" : 'GG Average Mach Number 2',

	"F": 'GG Force 3',
	"Fy" : 'GG Force (Y) 5',
	"Fz" : 'GG Force (Z) 6',

	"Shr" : 'GG Average Shear Stress 7',
	"ShrZ" : 'GG Average Shear Stress (Z) 10',
	"ShrY" : 'GG Average Shear Stress (Y) 9',
"""
def writeTabToSTDOUT():
	toTablSub = ["DyP","M","F","Fy","Fz","Shr","ShrY","ShrZ"]
	units = ["Pa","","N","N","N","Pa","Pa","Pa"]


	for i in range(len(m.keys())):
		v = list(m.keys())[i]
		print("---,---,---")
		out = "*" + v + "*," + "New,Old"
		for j in range(len(toTablSub)):
			#print("Current v " + str(v) + " param " + toTablSub[j])
			unitPart = ""
			if(units[j] != ""):
				unitPart = " (" + str(units[j]) + ")"
			out += "\n" + str(toTablSub[j]) + str(unitPart) + "," + str(np.round(getInfo_str("new",v,toTablSub[j]),2)) + "," + str(np.round(getInfo_str("old",v,toTablSub[j]),2))
		print(out)



###### PLOT ######
def plot():
	outPDF = 'figure1.pdf' # shear, force func viteza 
	matplotlib.rcParams['figure.figsize'] = (8.5, 11*2/3)  # 17,22
	plt.rc('font', size=16)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=14)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig, axs = plt.subplots(nrows=3, ncols=1, sharex='col')
 
		ax = axs[0]

		v = mFLT.values()
		vInd = list(m.values())
		forceNet_n = []
		forceNetY_n = []
		ShrNet_n = []
		ShrZ_n = []
		ShrY_n = []

		forceNet_o = []
		forceNetY_o = []
		ShrNet_o = []
		ShrZ_o = []
		ShrY_o = []
		for i in range(len(v)):
			forceNet_n.append(getInfo_int(t["new"],vInd[i],f["F"]))
			forceNetY_n.append(getInfo_int(t["new"],vInd[i],f["Fy"]))
			ShrNet_n.append(getInfo_int(t["new"],vInd[i],f["Shr"]))
			ShrZ_n.append(getInfo_int(t["new"],vInd[i],f["ShrZ"]))
			ShrY_n.append(getInfo_int(t["new"],vInd[i],f["ShrY"]))
			forceNet_o.append(getInfo_int(t["old"],vInd[i],f["F"]))
			forceNetY_o.append(getInfo_int(t["old"],vInd[i],f["Fy"]))
			ShrNet_o.append(getInfo_int(t["old"],vInd[i],f["Shr"]))
			ShrZ_o.append(getInfo_int(t["old"],vInd[i],f["ShrZ"]))
			ShrY_o.append(getInfo_int(t["old"],vInd[i],f["ShrY"]))

		masterArr = [forceNet_n,forceNetY_n,ShrNet_n,ShrZ_n,ShrY_n,forceNet_o,forceNetY_o,ShrNet_o,ShrZ_o,ShrY_o]
		for i in range(len(masterArr))
		ax.plot(v,forceNet_n,marker='v',linestyle='solid',c='blue',label="Net Force (N) (New)")
		ax.plot(v,forceNetY_n,marker='v',linestyle='solid',c='blue',label="Y Force (N) (New)")


		ax = axs[2]
		ax.set_xlim(0.25,2.25)
		ax.set_xlabel("Mach Number")



		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")




plot()











