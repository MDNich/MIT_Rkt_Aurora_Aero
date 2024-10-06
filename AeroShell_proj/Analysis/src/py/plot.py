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
	plt.rc('font', size=12)  # controls default text size
	plt.rc('axes', labelsize=12)  # fontsize of the x and y labels
	plt.rc('xtick', labelsize=12)  # fontsize of the x tick labels
	plt.rc('ytick', labelsize=12)  # fontsize of the y tick labels
	plt.rc('legend', fontsize=10)  # fontsize of the legend
	print("init complete, beginning plotting...")
	# plt.rcParams['font.size'] = '10'
	with matplotlib.backends.backend_pdf.PdfPages(outPDF) as pdf:
		fig, axs = plt.subplots(nrows=2, ncols=2, sharex='col')
		plt.subplots_adjust(
			top=0.96,
			bottom=0.1,
			left=0.08,
			right=0.98,
			hspace=0.2,
			wspace=0.2
			)
 
		ax = axs[0][0]
		
		# prep for first two plots
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
		newMaster = []
		for i in range(len(masterArr)):
			newMaster.append(np.array(masterArr[i]))
			newMaster[i] = np.abs(newMaster[i])
		forceNet_n,forceNetY_n,ShrNet_n,ShrZ_n,ShrY_n,forceNet_o,forceNetY_o,ShrNet_o,ShrZ_o,ShrY_o = tuple(newMaster)
		
		ax.plot(v,forceNet_n,marker='v',linestyle='solid',c='royalblue',label="Net (New)")
		ax.plot(v,forceNetY_n,marker='v',linestyle='solid',c='navy',label="Y (New)")
		ax.plot(v,forceNet_o,marker='v',linestyle='dotted',c='royalblue',label="Net (Old)")
		ax.plot(v,forceNetY_o,marker='v',linestyle='dotted',c='navy',label="Y (Old)")
		ax.set_ylim(500,1200)
		ax.set_ylabel("Force (N)")
		ax.legend(loc='upper left',ncol=2)
		ax.tick_params(axis='y', colors='royalblue')
		ax.yaxis.label.set_color('royalblue')

		ax2 = axs[0][1]
		ax2.plot(v,ShrNet_n,marker='o',linestyle='solid',c='red',label="Net (New)")
		ax2.plot(v,ShrZ_n,marker='o',linestyle='solid',c='maroon',label="Z (New)")
		ax2.plot(v,ShrY_n,marker='o',linestyle='solid',c='lightcoral',label="Y (New)")
		ax2.plot(v,ShrNet_o,marker='o',linestyle='dotted',c='red',label="Net (Old)")
		ax2.plot(v,ShrZ_o,marker='o',linestyle='dotted',c='maroon',label="Z (Old)")
		ax2.plot(v,ShrY_o,marker='o',linestyle='dotted',c='lightcoral',label="Y (Old)")
		ax2.legend(ncol=2)
		ax2.set_ylim(0,375)
		ax2.yaxis.label.set_color('red')
		ax2.tick_params(axis='y', colors='red')
		ax2.set_ylabel("Shear Stress (Pa)")


		ax = axs[1][0] # lower left
		ax2 = axs[1][1] # lower right

		dyP_n = []
		M_n = []

		dyP_o = []
		M_o = []

		for i in range(len(v)):
			dyP_n.append(getInfo_int(t["new"],vInd[i],f["DyP"]))
			M_n.append(getInfo_int(t["new"],vInd[i],f["M"]))
			dyP_o.append(getInfo_int(t["old"],vInd[i],f["DyP"]))
			M_o.append(getInfo_int(t["old"],vInd[i],f["M"]))

		masterArr = [dyP_n,M_n,dyP_o,M_o]
		newMaster = []
		for i in range(len(masterArr)):
			newMaster.append(np.array(masterArr[i]))
			newMaster[i] = np.abs(newMaster[i])
		dyP_n,M_n,dyP_o,M_o = tuple(newMaster)
		
		dyP_n *= 1e-4
		dyP_o *= 1e-4
		
		ax.plot(v,dyP_n,marker='s',markersize=5,linestyle='solid',c='green',label="New")
		ax.plot(v,dyP_o,marker='s',markersize=5,linestyle='dotted',c='green',label="Old")
		ax.set_ylim(0,26)
		ax.yaxis.label.set_color('green')
		ax.tick_params(axis='y', colors='green')
		ax.set_ylabel("Dynamic Pressure ($10^4$ Pa)")
		ax.legend()

		ax2.plot(np.linspace(0,3,1000),np.linspace(0,3,1000),linestyle='solid',alpha=0.4,c='k',label="Freestream")
		ax2.plot(v,M_n,marker='*',markersize=10,linestyle='solid',c='sandybrown',label="New")
		ax2.plot(v,M_o,marker='*',markersize=10,linestyle='dotted',c='saddlebrown',label="Old")
		ax2.legend()
		ax2.set_ylim(0.4,2)
		ax2.yaxis.label.set_color('saddlebrown')
		ax2.tick_params(axis='y', colors='saddlebrown')
		ax2.set_ylabel("Mach Number")
		


		ax.set_xlim(0.45,2.05)
		ax.set_xlabel("Mach Number")
		ax.set_xticks([0.5,1,1.5,2])

		ax2.set_xlim(0.45,2.05)
		ax2.set_xlabel("Mach Number")
		ax2.set_xticks([0.5,1,1.5,2])

		print("Rendering and saving to PDF...")
		pdf.savefig(fig)
		plt.close()

		print("COMPLETELY done!")




plot()











